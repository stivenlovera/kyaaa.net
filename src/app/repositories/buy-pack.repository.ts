import { IBuyPack } from "../types/buy_pack.types";
import { prisma } from "../utils/prisma";
import { METHOD_BUY } from "../utils/method-buy";

export const repositoryBuyPack = {
    findBuyPerUser: async (user_id: number): Promise<IBuyPack[]> => {
        const buys = await prisma.buy_Pack.findMany({
            select: {
                pack_id: true,
                user_id: true,
            },
            where: {
                user_id: user_id
            }
        });
        return buys;
    },

    /** Compra con PayPal. `amounts` son strings tal como los devuelve PayPal (p. ej. "4.43"). */
    create: async (pack_id: number, user_id: number, transaction: string, amounts: { net: string, gross: string, fee: string, currency: string }, content: string): Promise<IBuyPack> => {
        const like = await prisma.buy_Pack.create({
            data: {
                user_id: user_id,
                pack_id: pack_id,
                method_buy_id: METHOD_BUY.PAYPAL,
                // price es el neto (lo que queda tras la comisión); gross lo que pagó el comprador.
                price: parseFloat(amounts.net),
                gross: parseFloat(amounts.gross),
                fee: parseFloat(amounts.fee),
                currency: amounts.currency,
                transaction: transaction,
                content: content
            }
        });
        return like;
    },

    delete: async (user_id: number, pack_id: number): Promise<void> => {
        await prisma.buy_Pack.deleteMany({
            where: {
                user_id: user_id,
                pack_id: pack_id
            }
        });
    },

    verfiedLikeForUser: async (user_id: number, pack_id: number): Promise<IBuyPack | null> => {
        const like = await prisma.buy_Pack.findFirst({
            select: {
                pack_id: true,
                user_id: true
            },
            where: {
                user_id: user_id,
                pack_id: pack_id
            }
        });
        return like;
    }
}