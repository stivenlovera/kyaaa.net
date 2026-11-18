import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/utils/auth";
import { repositoryCoupon } from "@/src/app/repositories/coupon.repository";
import { formatCouponCode, normalizeCouponCode } from "@/src/app/utils/coupon-code";
import { sendPurchaseMails } from "@/src/app/utils/purchase-mails";
import { createRateLimit } from "@/src/app/utils/rate-limit";
import { RedeemResult } from "@/src/app/types/coupon.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../../generated/prisma/client";

// 10 códigos inexistentes cada 15 min por usuario: suficiente para errores de tipeo, inútil para probar a ciegas.
const failedAttempts = createRateLimit(10, 15 * 60 * 1000);

const reply = (result: RedeemResult, status = 200) => {
    const resp: IResponse<RedeemResult> = { data: result, message: result.ok ? 'Cupón canjeado' : result.error, success: result.ok };
    return NextResponse.json(resp, { status });
}

// Canjea un cupón para el usuario logueado. Los errores esperables (código inválido, usado, caducado,
// pack ya comprado) responden 200 con success=false y la clave del error, para que el cliente la traduzca.
export async function POST(request: NextRequest) {
    logger.info(`api/coupon/redeem POST`)
    try {
        const user = await getCurrentUser();
        if (user === null) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const key = String(user.user_id);
        if (failedAttempts.isLimited(key)) {
            return NextResponse.json({ success: false, message: 'demasiados_intentos' }, { status: 429 });
        }
        const body: { code?: string } = await request.json();
        const code = normalizeCouponCode(body.code ?? '');
        if (code === null) {
            failedAttempts.hit(key);
            return reply({ ok: false, error: 'invalido' });
        }
        let result: RedeemResult;
        try {
            result = await repositoryCoupon.redeem(code, user.user_id);
        } catch (error) {
            // Dos cupones del mismo pack canjeados a la vez por el mismo usuario: la clave de buy_pack
            // rechaza el segundo y la transacción lo deja libre.
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return reply({ ok: false, error: 'ya_tienes' });
            }
            throw error;
        }
        if (!result.ok && result.error === 'invalido') {
            failedAttempts.hit(key);
        }
        logger.info(`api/coupon/redeem POST user=${user.user_id} result=${jsonLog(result)}`)
        if (result.ok) {
            // Sin await: el correo no debe retrasar la respuesta; sendPurchaseMails registra los fallos.
            void sendPurchaseMails(user, result.pack.code, { method: 'coupon', reference: formatCouponCode(code) });
        }
        return reply(result);
    } catch (error: any) {
        logger.error(`api/coupon/redeem POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}
