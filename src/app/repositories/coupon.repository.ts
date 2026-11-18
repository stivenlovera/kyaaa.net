import { randomInt } from "crypto";
import { Prisma } from "../../../generated/prisma/client";
import { CouponStatus, IAdminCoupon, IAdminCouponPage, RedeemResult } from "../types/coupon.types";
import { COUPON_ALPHABET, COUPON_LENGTH } from "../utils/coupon-code";
import { METHOD_BUY } from "../utils/method-buy";
import { prisma } from "../utils/prisma";

const ADMIN_SELECT = {
    coupon_id: true,
    code: true,
    pack: { select: { pack_id: true, name: true, code: true } },
    expires_at: true,
    note: true,
    user: { select: { user_id: true, nick: true, email: true } },
    redeemed_at: true,
    create_at: true,
} satisfies Prisma.CouponSelect;

const randomCode = (): string =>
    Array.from({ length: COUPON_LENGTH }, () => COUPON_ALPHABET[randomInt(COUPON_ALPHABET.length)]).join('');

const statusWhere = (status: CouponStatus | undefined, now: Date): Prisma.CouponWhereInput => {
    switch (status) {
        case 'free': return { user_id: null, expires_at: { gt: now } };
        case 'redeemed': return { user_id: { not: null } };
        case 'expired': return { user_id: null, expires_at: { lte: now } };
        default: return {};
    }
}

export const repositoryCoupon = {

    findPaginated: async (page: number, pageSize: number, filter: { status?: CouponStatus, pack_id?: number } = {}): Promise<IAdminCouponPage> => {
        const where: Prisma.CouponWhereInput = {
            ...statusWhere(filter.status, new Date()),
            ...(filter.pack_id !== undefined ? { pack_id: filter.pack_id } : {}),
        };
        const [coupons, total] = await Promise.all([
            prisma.coupon.findMany({
                where,
                orderBy: { coupon_id: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: ADMIN_SELECT,
            }),
            prisma.coupon.count({ where }),
        ]);
        return { coupons, total };
    },

    /** Genera `quantity` códigos nuevos para el pack y los devuelve. */
    generate: async (pack_id: number, quantity: number, expires_at: Date, note: string | null): Promise<IAdminCoupon[]> => {
        const codes = new Set<string>();
        while (codes.size < quantity) {
            codes.add(randomCode());
        }
        // Una colisión con un código ya guardado es prácticamente imposible (32^12 combinaciones);
        // skipDuplicates la descarta en lugar de fallar todo el lote, y se devuelven solo los creados.
        await prisma.coupon.createMany({
            data: [...codes].map((code) => ({ code, pack_id, expires_at, note })),
            skipDuplicates: true,
        });
        return await prisma.coupon.findMany({
            where: { code: { in: [...codes] }, pack_id, user_id: null },
            orderBy: { coupon_id: 'asc' },
            select: ADMIN_SELECT,
        });
    },

    /** Borra un código sin usar (revocarlo). Devuelve false si no existe o ya se canjeó. */
    deleteUnused: async (coupon_id: number): Promise<boolean> => {
        const { count } = await prisma.coupon.deleteMany({ where: { coupon_id, user_id: null } });
        return count > 0;
    },

    /**
     * Canjea `code` (ya normalizado) para el usuario: marca el cupón como usado y crea su fila en
     * buy_pack, que es lo que da acceso al pack (findPagesPack / descarga / Mis compras).
     * Todo en una transacción: si algo falla, el cupón sigue libre.
     */
    redeem: async (code: string, user_id: number): Promise<RedeemResult> => {
        return await prisma.$transaction(async (tx) => {
            const coupon = await tx.coupon.findUnique({
                where: { code },
                select: { coupon_id: true, pack_id: true, user_id: true, expires_at: true, pack: { select: { code: true, name: true } } },
            });
            if (coupon === null) {
                return { ok: false, error: 'invalido' };
            }
            if (coupon.user_id !== null) {
                return { ok: false, error: 'usado' };
            }
            const now = new Date();
            if (coupon.expires_at <= now) {
                return { ok: false, error: 'caducado' };
            }
            // Si ya tiene el pack (comprado o canjeado antes) no se gasta el cupón: puede regalarlo.
            const owned = await tx.buy_Pack.findFirst({ where: { pack_id: coupon.pack_id, user_id }, select: { pack_id: true } });
            if (owned !== null) {
                return { ok: false, error: 'ya_tienes' };
            }
            // Condición en el propio UPDATE: si otra petición lo canjeó a la vez, no afecta filas.
            const { count } = await tx.coupon.updateMany({
                where: { coupon_id: coupon.coupon_id, user_id: null, expires_at: { gt: now } },
                data: { user_id, redeemed_at: now },
            });
            if (count === 0) {
                return { ok: false, error: 'usado' };
            }
            await tx.buy_Pack.create({
                data: {
                    pack_id: coupon.pack_id,
                    user_id,
                    method_buy_id: METHOD_BUY.COUPON,
                    price: 0,
                    gross: 0,
                    fee: 0,
                    transaction: code,
                    content: JSON.stringify({ coupon_id: coupon.coupon_id, code }),
                },
            });
            return { ok: true, pack: coupon.pack };
        });
    },
}
