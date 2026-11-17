import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryCoupon } from "@/src/app/repositories/coupon.repository";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { IAdminCoupon, IFormCouponGenerate } from "@/src/app/types/coupon.types";
import { MAX_COUPONS_PER_BATCH } from "@/src/app/utils/coupon-code";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";


// 'YYYY-MM-DD' → el final de ese día (hora del servidor), o null si no es una fecha válida.
const endOfDay = (value: string | undefined): Date | null => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }
    const date = new Date(`${value}T23:59:59`);
    return isNaN(date.getTime()) ? null : date;
}

// Genera un lote de códigos para un pack (solo admin).
export async function POST(request: NextRequest) {
    logger.info(`api/coupon POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormCouponGenerate = await request.json();
        const quantity = Math.trunc(Number(body.quantity));
        if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_COUPONS_PER_BATCH) {
            return NextResponse.json({ success: false, message: `La cantidad debe estar entre 1 y ${MAX_COUPONS_PER_BATCH}` }, { status: 400 });
        }
        const expires_at = endOfDay(body.expires_at);
        if (expires_at === null) {
            return NextResponse.json({ success: false, message: 'La fecha de caducidad no es válida' }, { status: 400 });
        }
        if (expires_at <= new Date()) {
            return NextResponse.json({ success: false, message: 'La fecha de caducidad debe ser futura' }, { status: 400 });
        }
        if (body.pack_id === undefined || (await repositoryPack.findCodeById(body.pack_id)) === null) {
            return NextResponse.json({ success: false, message: 'El pack no existe' }, { status: 400 });
        }
        const note = body.note?.trim() ? body.note.trim().slice(0, 250) : null;
        const coupons = await repositoryCoupon.generate(body.pack_id, quantity, expires_at, note);
        logger.info(`api/coupon POST pack_id=${body.pack_id} generados=${coupons.length}`)
        const resp: IResponse<IAdminCoupon[]> = { data: coupons, message: 'Cupones generados', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/coupon POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

// Revoca (borra) un código que aún no se canjeó (solo admin).
export async function DELETE(request: NextRequest) {
    logger.info(`api/coupon DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { coupon_id?: number } = await request.json();
        if (body.coupon_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta coupon_id' }, { status: 400 });
        }
        const deleted = await repositoryCoupon.deleteUnused(body.coupon_id);
        if (!deleted) {
            return NextResponse.json({ success: false, message: 'El cupón no existe o ya fue canjeado' }, { status: 409 });
        }
        const resp: IResponse<null> = { data: null, message: 'Cupón eliminado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/coupon DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
