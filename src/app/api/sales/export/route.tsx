import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositorySales } from "@/src/app/repositories/sales.repository";
import { parseSalesFilter, toDateInput } from "@/src/app/utils/sales-filter";
import logger, { jsonLog } from "@/src/app/utils/logger";

// CSV de las ventas con los mismos filtros que /admin/sales (solo admin). Con BOM para que Excel lo abra
// en UTF-8; importes con punto decimal.

const csvCell = (value: string | number): string => {
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const pad = (n: number) => String(n).padStart(2, '0');
const dateTime = (d: Date) => `${toDateInput(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

export async function GET(request: NextRequest) {
    logger.info(`api/sales/export GET`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const params = Object.fromEntries(request.nextUrl.searchParams);
        const { filter, values } = parseSalesFilter(params);
        const sales = await repositorySales.findForExport(filter);

        const header = ['fecha', 'pack_code', 'pack', 'usuario', 'email', 'metodo', 'bruto', 'comision', 'neto', 'moneda', 'transaccion'];
        const lines = sales.map((s) => [
            dateTime(new Date(s.create_at)),
            s.pack.code,
            s.pack.name,
            s.user.nick,
            s.user.email,
            s.method === 'coupon' ? 'cupon' : 'paypal',
            s.gross.toFixed(2),
            s.fee.toFixed(2),
            s.net.toFixed(2),
            s.currency,
            s.transaction,
        ].map(csvCell).join(','));
        const csv = '﻿' + [header.join(','), ...lines].join('\r\n') + '\r\n';

        const name = values.all ? 'ventas-todo' : `ventas-${values.from || 'inicio'}_${values.to || 'hoy'}`;
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${name}.csv"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error: any) {
        logger.error(`api/sales/export GET error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}
