import { Prisma } from "../../../generated/prisma/client";
import { ISale, ISalesFilter, ISalesPage, ISalesSummary, ITopPack, SaleMethod } from "../types/sales.types";
import { METHOD_BUY } from "../utils/method-buy";
import { prisma } from "../utils/prisma";

// Consultas de ventas para /admin/sales. gross/fee pueden ser NULL en ventas antiguas cuyo JSON de PayPal
// no traía los importes (ver data-base/migrations/2026-11-20_buy_pack_gross_fee.sql): entonces se toma el
// neto como bruto y la comisión como 0.

const SALE_SELECT = {
    pack: { select: { pack_id: true, code: true, name: true } },
    user: { select: { user_id: true, nick: true, email: true } },
    method_buy_id: true,
    price: true,
    gross: true,
    fee: true,
    currency: true,
    transaction: true,
    create_at: true,
} satisfies Prisma.Buy_PackSelect;

type SaleRow = Prisma.Buy_PackGetPayload<{ select: typeof SALE_SELECT }>;

const num = (value: Prisma.Decimal | null | undefined): number => value == null ? 0 : Number(value);

const METHOD_IDS: Record<SaleMethod, number> = {
    paypal: METHOD_BUY.PAYPAL,
    nowpayments: METHOD_BUY.NOWPAYMENTS,
    coupon: METHOD_BUY.COUPON,
};

const methodOf = (method_buy_id: number): SaleMethod =>
    (Object.keys(METHOD_IDS) as SaleMethod[]).find((m) => METHOD_IDS[m] === method_buy_id) ?? 'paypal';

const toSale = (row: SaleRow): ISale => {
    const net = num(row.price);
    return {
        pack: row.pack,
        user: row.user,
        method: methodOf(row.method_buy_id),
        gross: row.gross == null ? net : num(row.gross),
        fee: num(row.fee),
        net,
        currency: row.currency ?? 'USD',
        transaction: row.transaction,
        create_at: row.create_at,
    };
};

const whereOf = ({ from, to, pack_id, method }: ISalesFilter): Prisma.Buy_PackWhereInput => ({
    ...(from || to ? { create_at: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(pack_id !== undefined ? { pack_id } : {}),
    ...(method ? { method_buy_id: METHOD_IDS[method] } : {}),
});

/** Máximo de filas del CSV: de sobra para un periodo; evita cargar toda la tabla por error. */
export const SALES_EXPORT_LIMIT = 10000;

export const repositorySales = {

    findPaginated: async (page: number, pageSize: number, filter: ISalesFilter): Promise<ISalesPage> => {
        const where = whereOf(filter);
        const [rows, total] = await Promise.all([
            prisma.buy_Pack.findMany({
                where,
                orderBy: { create_at: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: SALE_SELECT,
            }),
            prisma.buy_Pack.count({ where }),
        ]);
        return { sales: rows.map(toSale), total };
    },

    findForExport: async (filter: ISalesFilter): Promise<ISale[]> => {
        const rows = await prisma.buy_Pack.findMany({
            where: whereOf(filter),
            orderBy: { create_at: 'desc' },
            take: SALES_EXPORT_LIMIT,
            select: SALE_SELECT,
        });
        return rows.map(toSale);
    },

    summary: async (filter: ISalesFilter): Promise<ISalesSummary> => {
        const where = whereOf(filter);
        const [byMethod, withoutGross] = await Promise.all([
            prisma.buy_Pack.groupBy({
                by: ['method_buy_id'],
                where,
                _count: { _all: true },
                _sum: { gross: true, fee: true, price: true },
            }),
            // Ventas antiguas sin bruto: cuentan su neto como bruto.
            prisma.buy_Pack.aggregate({ where: { ...where, gross: null }, _sum: { price: true } }),
        ]);
        const summary: ISalesSummary = { sales: 0, coupons: 0, gross: num(withoutGross._sum.price), fee: 0, net: 0 };
        for (const group of byMethod) {
            if (group.method_buy_id === METHOD_BUY.COUPON) {
                summary.coupons += group._count._all;
            } else {
                summary.sales += group._count._all;
            }
            summary.gross += num(group._sum.gross);
            summary.fee += num(group._sum.fee);
            summary.net += num(group._sum.price);
        }
        return summary;
    },

    /** Packs con más ventas en el periodo (sin contar cupones). */
    topPacks: async (filter: ISalesFilter, limit = 5): Promise<ITopPack[]> => {
        const where = whereOf(filter);
        const groups = await prisma.buy_Pack.groupBy({
            by: ['pack_id'],
            // Con filtro de método se respeta; sin él, todas las ventas pagadas.
            where: filter.method ? where : { ...where, method_buy_id: { not: METHOD_BUY.COUPON } },
            _count: { _all: true },
            _sum: { gross: true },
            orderBy: [{ _count: { pack_id: 'desc' } }, { _sum: { gross: 'desc' } }],
            take: limit,
        });
        if (groups.length === 0) {
            return [];
        }
        const packs = await prisma.pack.findMany({
            where: { pack_id: { in: groups.map((g) => g.pack_id) } },
            select: { pack_id: true, code: true, name: true },
        });
        return groups.flatMap((g) => {
            const pack = packs.find((p) => p.pack_id === g.pack_id);
            return pack ? [{ pack, sales: g._count._all, gross: num(g._sum.gross) }] : [];
        });
    },
}
