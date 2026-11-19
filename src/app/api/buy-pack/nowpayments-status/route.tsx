import { repositoryPaymentOrder } from "@/src/app/repositories/payment-order.repository";
import { getCurrentUser } from "@/src/app/utils/auth";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { NextRequest, NextResponse } from "next/server";

/** Estado de un pago con cripto del usuario actual (la página de vuelta lo consulta hasta que termina). */
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (user === null) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const orderId = Number(request.nextUrl.searchParams.get('order'));
        const order = Number.isInteger(orderId) ? await repositoryPaymentOrder.findById(orderId) : null;
        if (order === null || order.user_id !== user.user_id) {
            return NextResponse.json({ success: false, message: 'Pago no encontrado' }, { status: 404 });
        }
        return NextResponse.json({
            success: true,
            message: 'ok',
            data: { status: order.status, completed: order.completed_at !== null, code: order.pack_code },
        }, { status: 200 });
    }
    catch (error) {
        logger.error(`/api/buy-pack/nowpayments-status GET ${jsonLog(error instanceof Error ? error.message : error)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}
