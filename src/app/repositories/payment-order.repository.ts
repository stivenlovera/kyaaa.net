import { prisma } from "../utils/prisma";
import { METHOD_BUY } from "../utils/method-buy";
import { ISaleAmounts } from "../utils/nowpayments";
import { Prisma } from "../../../generated/prisma/client";
import { AdminPaymentFilter, IAdminPaymentOrder, IAdminPaymentPage } from "../types/payment-order.types";

// Intentos de pago de pasarelas asíncronas (NOWPayments). Ver data-base/migrations/2026-11-21_nowpayments.sql.

export interface IPaymentOrder {
    payment_order_id: number
    user_id: number
    pack_id: number
    pack_code: string
    amount: number
    currency: string
    status: string
    completed_at: Date | null
    /** Devolución marcada a mano: la orden ya no se completa aunque lleguen más avisos. */
    refunded_at: Date | null
}

const SELECT = {
    payment_order_id: true,
    user_id: true,
    pack_id: true,
    amount: true,
    currency: true,
    status: true,
    completed_at: true,
    refunded_at: true,
    pack: { select: { code: true } },
} as const;

const toOrder = <T extends { amount: { toNumber: () => number }, pack: { code: string } }>({ pack, ...row }: T) =>
    ({ ...row, pack_code: pack.code, amount: row.amount.toNumber() });

const ADMIN_SELECT = {
    payment_order_id: true,
    amount: true,
    currency: true,
    status: true,
    payment_id: true,
    content: true,
    completed_at: true,
    refund_txid: true,
    refund_note: true,
    refunded_at: true,
    create_at: true,
    user: { select: { user_id: true, nick: true, email: true } },
    pack: { select: { pack_id: true, code: true, name: true } },
} satisfies Prisma.Payment_OrderSelect;

const numberOrNull = (value: unknown): number | null => {
    const n = Number(value);
    return value == null || value === '' || !Number.isFinite(n) ? null : n;
};

/** Importes del último IPN guardado en content (JSON de NOWPayments). */
export const paidFromContent = (content: string | null): IAdminPaymentOrder['paid'] => {
    if (!content) return null;
    try {
        const ipn = JSON.parse(content);
        return {
            fiat: numberOrNull(ipn.actually_paid_at_fiat),
            crypto: numberOrNull(ipn.actually_paid),
            expected: numberOrNull(ipn.pay_amount),
            pay_currency: typeof ipn.pay_currency === 'string' ? ipn.pay_currency : null,
        };
    } catch {
        return null;
    }
};

const adminWhere = (filter: AdminPaymentFilter): Prisma.Payment_OrderWhereInput => {
    switch (filter) {
        case 'partial': return { completed_at: null, refunded_at: null, status: { in: ['partially_paid', 'amount_mismatch'] } };
        // Sin entregar ni devolver, salvo los que nunca recibieron un aviso (invoices abiertos y abandonados).
        case 'open': return { completed_at: null, refunded_at: null, status: { not: 'refunded' }, payment_id: { not: null } };
        case 'completed': return { completed_at: { not: null } };
        // Devueltos a mano o por NOWPayments.
        case 'refunded': return { OR: [{ refunded_at: { not: null } }, { status: 'refunded' }] };
        default: return {};
    }
};

export type CompleteResult = 'completed' | 'already_completed' | 'already_owned';

export const repositoryPaymentOrder = {
    create: async (user_id: number, pack_id: number, amount: number, currency: string): Promise<IPaymentOrder> => {
        const row = await prisma.payment_Order.create({
            data: { user_id, pack_id, method_buy_id: METHOD_BUY.NOWPAYMENTS, amount, currency },
            select: SELECT,
        });
        return toOrder(row);
    },

    setExternalId: async (payment_order_id: number, external_id: string): Promise<void> => {
        await prisma.payment_Order.update({ where: { payment_order_id }, data: { external_id } });
    },

    findById: async (payment_order_id: number): Promise<IPaymentOrder | null> => {
        const row = await prisma.payment_Order.findUnique({ where: { payment_order_id }, select: SELECT });
        return row ? toOrder(row) : null;
    },

    /** Guarda el último aviso de la pasarela (no toca las órdenes ya completadas ni las devueltas a mano). */
    updateStatus: async (payment_order_id: number, status: string, payment_id: string, content: string): Promise<void> => {
        await prisma.payment_Order.updateMany({
            where: { payment_order_id, completed_at: null, refunded_at: null },
            data: { status, payment_id, content },
        });
    },

    findAdminPaginated: async (page: number, pageSize: number, filter: AdminPaymentFilter): Promise<IAdminPaymentPage> => {
        const where = adminWhere(filter);
        const [rows, total] = await Promise.all([
            prisma.payment_Order.findMany({
                where,
                orderBy: { payment_order_id: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: ADMIN_SELECT,
            }),
            prisma.payment_Order.count({ where }),
        ]);
        return {
            orders: rows.map(({ content, amount, refund_txid, refund_note, refunded_at, ...row }) => ({
                ...row,
                amount: amount.toNumber(),
                paid: paidFromContent(content),
                refund: refunded_at !== null ? { txid: refund_txid ?? '', note: refund_note, at: refunded_at } : null,
            })),
            total,
        };
    },

    /** Para entregar a mano desde /admin/crypto: payment_id y último JSON del IPN. */
    findForDelivery: async (payment_order_id: number) => {
        const row = await prisma.payment_Order.findUnique({
            where: { payment_order_id },
            select: { ...SELECT, payment_id: true, content: true },
        });
        return row ? { ...toOrder(row), payment_id: row.payment_id, content: row.content } : null;
    },

    /**
     * Deja constancia de una devolución hecha fuera de kyaaa.net (NOWPayments o exchange). No mueve dinero.
     * Solo para órdenes sin entregar ni devolver; devuelve false si no se pudo marcar.
     */
    markRefunded: async (payment_order_id: number, txid: string, note: string | null): Promise<boolean> => {
        const marked = await prisma.payment_Order.updateMany({
            where: { payment_order_id, completed_at: null, refunded_at: null },
            data: { status: 'refunded', refund_txid: txid, refund_note: note, refunded_at: new Date() },
        });
        return marked.count > 0;
    },

    /**
     * Marca la orden como pagada y crea la compra, en una transacción. Idempotente: un IPN repetido devuelve
     * 'already_completed'. Si el usuario ya tenía el pack (p. ej. lo pagó también con PayPal) no se crea otra fila.
     */
    complete: async (payment_order_id: number, payment_id: string, content: string, amounts: ISaleAmounts): Promise<CompleteResult> => {
        return prisma.$transaction(async (tx) => {
            const marked = await tx.payment_Order.updateMany({
                // Una orden devuelta a mano no se completa: cuenta como 'already_completed' (no se entrega).
                where: { payment_order_id, completed_at: null, refunded_at: null },
                data: { status: 'finished', payment_id, content, completed_at: new Date() },
            });
            if (marked.count === 0) {
                return 'already_completed';
            }
            const order = await tx.payment_Order.findUniqueOrThrow({ where: { payment_order_id } });
            const owned = await tx.buy_Pack.findFirst({ where: { user_id: order.user_id, pack_id: order.pack_id }, select: { pack_id: true } });
            if (owned !== null) {
                return 'already_owned';
            }
            await tx.buy_Pack.create({
                data: {
                    user_id: order.user_id,
                    pack_id: order.pack_id,
                    method_buy_id: METHOD_BUY.NOWPAYMENTS,
                    // price es el neto, como en PayPal (ver saleAmounts).
                    price: amounts.net,
                    gross: amounts.gross,
                    fee: amounts.fee,
                    currency: amounts.currency,
                    transaction: payment_id,
                    content,
                },
            });
            return 'completed';
        });
    },
}
