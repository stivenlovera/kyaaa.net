import { prisma } from "../utils/prisma";
import { METHOD_BUY } from "../utils/method-buy";

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
}

const SELECT = {
    payment_order_id: true,
    user_id: true,
    pack_id: true,
    amount: true,
    currency: true,
    status: true,
    completed_at: true,
    pack: { select: { code: true } },
} as const;

const toOrder = <T extends { amount: { toNumber: () => number }, pack: { code: string } }>({ pack, ...row }: T) =>
    ({ ...row, pack_code: pack.code, amount: row.amount.toNumber() });

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

    /** Guarda el último aviso de la pasarela (no toca las órdenes ya completadas). */
    updateStatus: async (payment_order_id: number, status: string, payment_id: string, content: string): Promise<void> => {
        await prisma.payment_Order.updateMany({
            where: { payment_order_id, completed_at: null },
            data: { status, payment_id, content },
        });
    },

    /**
     * Marca la orden como pagada y crea la compra, en una transacción. Idempotente: un IPN repetido devuelve
     * 'already_completed'. Si el usuario ya tenía el pack (p. ej. lo pagó también con PayPal) no se crea otra fila.
     */
    complete: async (payment_order_id: number, payment_id: string, content: string, amounts: { gross: number, currency: string }): Promise<CompleteResult> => {
        return prisma.$transaction(async (tx) => {
            const marked = await tx.payment_Order.updateMany({
                where: { payment_order_id, completed_at: null },
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
                    // NOWPayments no da la comisión en la moneda del precio: neto = bruto y comisión desconocida.
                    price: amounts.gross,
                    gross: amounts.gross,
                    fee: null,
                    currency: amounts.currency,
                    transaction: payment_id,
                    content,
                },
            });
            return 'completed';
        });
    },
}
