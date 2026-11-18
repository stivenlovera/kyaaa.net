import { randomBytes, randomInt } from "crypto";
import { Prisma } from "../../../generated/prisma/client";
import {
    FINISHED_STATUSES,
    IAdminTicket,
    IAdminTicketPage,
    ITicketDetail,
    ITicketSummary,
    TicketCategory,
    TicketStatus,
} from "../types/ticket.types";
import { COUPON_ALPHABET } from "../utils/coupon-code";
import { TICKET_CODE_LENGTH } from "../utils/ticket-code";
import { prisma } from "../utils/prisma";

const SUMMARY_SELECT = {
    ticket_id: true,
    code: true,
    category: true,
    subject: true,
    status: true,
    create_at: true,
    update_at: true,
    pack: { select: { code: true, name: true } },
} satisfies Prisma.TicketSelect;

type SummaryRow = Prisma.TicketGetPayload<{ select: typeof SUMMARY_SELECT }>;

// category y status son texto en la BD; la API solo escribe valores válidos.
const toSummary = (row: SummaryRow): ITicketSummary => ({
    ...row,
    category: row.category as TicketCategory,
    status: row.status as TicketStatus,
});

const randomCode = (): string =>
    Array.from({ length: TICKET_CODE_LENGTH }, () => COUPON_ALPHABET[randomInt(COUPON_ALPHABET.length)]).join('');

const closedAt = (status: TicketStatus): Date | null => FINISHED_STATUSES.includes(status) ? new Date() : null;

interface CreateTicketData {
    user_id: number | null
    email: string
    category: TicketCategory
    subject: string
    body: string
    pack_id: number | null
}

export interface ITicketUserContext {
    user: { user_id: number, nick: string, email: string, verified_email: Date | null, create_at: Date }
    purchases: { pack: { code: string, name: string }, method: string, price: string, transaction: string, create_at: Date }[]
}

export const repositoryTicket = {

    /** Crea el ticket con su primer mensaje. Reintenta si el código aleatorio ya existe. */
    create: async (data: CreateTicketData): Promise<{ ticket_id: number, code: string, access_token: string }> => {
        const access_token = randomBytes(24).toString('base64url');
        for (let attempt = 0; ; attempt++) {
            try {
                return await prisma.ticket.create({
                    data: {
                        code: randomCode(),
                        access_token,
                        user_id: data.user_id,
                        email: data.email,
                        category: data.category,
                        subject: data.subject,
                        pack_id: data.pack_id,
                        messages: { create: { user_id: data.user_id, is_staff: false, body: data.body } },
                    },
                    select: { ticket_id: true, code: true, access_token: true },
                });
            } catch (error) {
                if (attempt < 4 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                    continue;
                }
                throw error;
            }
        }
    },

    /** Tickets del usuario, los movidos más recientemente primero. */
    findByUser: async (user_id: number): Promise<ITicketSummary[]> => {
        const rows = await prisma.ticket.findMany({
            where: { user_id },
            orderBy: { update_at: 'desc' },
            select: SUMMARY_SELECT,
        });
        return rows.map(toSummary);
    },

    findDetail: async (code: string): Promise<ITicketDetail | null> => {
        const row = await prisma.ticket.findUnique({
            where: { code },
            select: {
                ...SUMMARY_SELECT,
                email: true,
                user_id: true,
                access_token: true,
                messages: {
                    orderBy: { ticket_message_id: 'asc' },
                    select: { ticket_message_id: true, is_staff: true, body: true, create_at: true, user: { select: { nick: true } } },
                },
            },
        });
        if (row === null) {
            return null;
        }
        return { ...row, category: row.category as TicketCategory, status: row.status as TicketStatus };
    },

    /**
     * Añade un mensaje y mueve el estado: si responde el usuario a un ticket en espera o resuelto, se
     * reabre; si responde el staff a uno abierto o en curso, queda "esperando al usuario".
     * Devuelve el estado resultante.
     */
    addMessage: async (ticket_id: number, message: { user_id: number | null, is_staff: boolean, body: string }): Promise<TicketStatus> => {
        return await prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.findUniqueOrThrow({ where: { ticket_id }, select: { status: true } });
            const current = ticket.status as TicketStatus;
            let next = current;
            if (!message.is_staff && (current === 'esperando_usuario' || current === 'resuelto')) {
                next = 'abierto';
            }
            if (message.is_staff && (current === 'abierto' || current === 'en_curso')) {
                next = 'esperando_usuario';
            }
            await tx.ticket_Message.create({ data: { ticket_id, ...message } });
            // Se actualiza siempre para que update_at marque la última actividad.
            await tx.ticket.update({
                where: { ticket_id },
                data: { status: next, closed_at: closedAt(next), update_at: new Date() },
            });
            return next;
        });
    },

    setStatus: async (ticket_id: number, status: TicketStatus): Promise<void> => {
        await prisma.ticket.update({ where: { ticket_id }, data: { status, closed_at: closedAt(status) } });
    },

    findPaginated: async (page: number, pageSize: number, filter: { status?: TicketStatus, category?: TicketCategory } = {}): Promise<IAdminTicketPage> => {
        const where: Prisma.TicketWhereInput = {
            ...(filter.status ? { status: filter.status } : {}),
            ...(filter.category ? { category: filter.category } : {}),
        };
        const [rows, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                orderBy: { update_at: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    ...SUMMARY_SELECT,
                    email: true,
                    user: { select: { user_id: true, nick: true } },
                    messages: { orderBy: { ticket_message_id: 'desc' }, take: 1, select: { is_staff: true } },
                },
            }),
            prisma.ticket.count({ where }),
        ]);
        const tickets: IAdminTicket[] = rows.map(({ messages, email, user, ...row }) => ({
            ...toSummary(row),
            email,
            user,
            awaiting_staff: messages[0]?.is_staff === false && !FINISHED_STATUSES.includes(row.status as TicketStatus),
        }));
        return { tickets, total };
    },

    /** Datos del usuario y sus compras, para atender el ticket sin buscar en la BD. */
    findUserContext: async (user_id: number): Promise<ITicketUserContext | null> => {
        const user = await prisma.user.findUnique({
            where: { user_id },
            select: { user_id: true, nick: true, email: true, verified_email: true, create_at: true },
        });
        if (user === null) {
            return null;
        }
        const purchases = await prisma.buy_Pack.findMany({
            where: { user_id },
            orderBy: { create_at: 'desc' },
            select: {
                pack: { select: { code: true, name: true } },
                method_buy: { select: { name: true } },
                price: true,
                transaction: true,
                create_at: true,
            },
        });
        return {
            user,
            purchases: purchases.map((p) => ({
                pack: p.pack,
                method: p.method_buy.name,
                price: p.price.toString(),
                transaction: p.transaction,
                create_at: p.create_at,
            })),
        };
    },
}
