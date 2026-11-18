import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/src/app/utils/auth";
import { repositoryTicket } from "@/src/app/repositories/ticket.repository";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { ANONYMOUS_CATEGORY, IFormTicketCreate, isTicketCategory, ITicketCreated, TICKET_LIMITS } from "@/src/app/types/ticket.types";
import { IResponse } from "@/src/app/types/response";
import { createRateLimit } from "@/src/app/utils/rate-limit";
import { ticketMails } from "@/src/app/utils/ticket-mails";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { clientIp, cleanText, ticketError } from "./_utils";

// 5 tickets por hora por usuario (o por IP sin sesión): de sobra para un usuario real, corta el spam.
const createLimit = createRateLimit(5, 60 * 60 * 1000);

const MIN_SUBJECT = 3;
const MIN_MESSAGE = 10;

// Crea un ticket. Con sesión, cualquier categoría y el email de la cuenta; sin sesión, solo la categoría
// 'cuenta' (no puede entrar) y con un email de contacto.
export async function POST(request: NextRequest) {
    logger.info(`api/ticket POST`)
    try {
        const user = await getCurrentUser();
        const key = user !== null ? `ticket:u:${user.user_id}` : `ticket:ip:${clientIp(request)}`;
        if (createLimit.isLimited(key)) {
            return ticketError('demasiados_intentos', 429);
        }

        const body: IFormTicketCreate = await request.json();
        if (!isTicketCategory(body.category)) {
            return ticketError('categoria');
        }
        if (user === null && body.category !== ANONYMOUS_CATEGORY) {
            // 403 y no 401: el interceptor de axios trata un 401 como sesión caducada e intenta refrescarla.
            return ticketError('requiere_sesion', 403);
        }
        const subject = cleanText(body.subject);
        if (subject.length < MIN_SUBJECT || subject.length > TICKET_LIMITS.subject) {
            return ticketError('asunto');
        }
        const message = cleanText(body.message);
        if (message.length < MIN_MESSAGE || message.length > TICKET_LIMITS.body) {
            return ticketError('mensaje');
        }
        let email: string;
        if (user !== null) {
            email = user.email;
        } else {
            const parsed = z.email().max(TICKET_LIMITS.email).safeParse(cleanText(body.email));
            if (!parsed.success) {
                return ticketError('email');
            }
            email = parsed.data;
        }
        const packCode = cleanText(body.pack_code);
        const pack = packCode ? await repositoryPack.findByCode(packCode) : null;

        createLimit.hit(key);
        const ticket = await repositoryTicket.create({
            user_id: user?.user_id ?? null,
            email,
            category: body.category,
            subject,
            body: message,
            pack_id: pack?.pack_id ?? null,
        });
        logger.info(`api/ticket POST creado code=${ticket.code} user=${user?.user_id ?? 'anónimo'} category=${body.category}`)

        // Sin await: el correo no debe retrasar la respuesta; ticketMails registra los fallos.
        void ticketMails.created(
            { code: ticket.code, access_token: ticket.access_token, category: body.category, subject, email },
            user?.name ?? email,
            message,
        );

        const resp: IResponse<ITicketCreated> = {
            data: { code: ticket.code, access_token: ticket.access_token },
            message: 'Ticket creado',
            success: true,
        };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/ticket POST error=> ${jsonLog(error.message)}`)
        return ticketError('servidor', 500);
    }
}
