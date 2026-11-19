import { repositoryAuth } from "@/src/app/repositories/auth.repository";
import { repositoryPaymentOrder } from "@/src/app/repositories/payment-order.repository";
import { saleAmounts } from "@/src/app/utils/nowpayments";
import { IResponse } from "@/src/app/types/response";
import { adminDenied, getCurrentUser } from "@/src/app/utils/auth";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { sendPurchaseMails } from "@/src/app/utils/purchase-mails";
import { NextRequest, NextResponse } from "next/server";

/**
 * Entrega a mano el pack de un pago con cripto que no se completó solo (p. ej. un parcial por debajo de la
 * tolerancia). Usa la misma transacción idempotente que el webhook. Bruto, neto y comisión salen del último
 * aviso guardado, igual que en el webhook (saleAmounts).
 */
export async function POST(request: NextRequest) {
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const { payment_order_id }: { payment_order_id?: number } = await request.json();
        if (!Number.isInteger(payment_order_id)) {
            return NextResponse.json({ success: false, message: 'Falta payment_order_id' }, { status: 400 });
        }
        const order = await repositoryPaymentOrder.findForDelivery(payment_order_id!);
        if (order === null) {
            return NextResponse.json({ success: false, message: 'El pago no existe' }, { status: 404 });
        }
        if (order.completed_at !== null) {
            return NextResponse.json({ success: false, message: 'Este pago ya se entregó' }, { status: 409 });
        }
        if (order.payment_id === null) {
            // Sin aviso de NOWPayments no hay constancia de que el comprador enviara nada.
            return NextResponse.json({ success: false, message: 'NOWPayments no ha notificado ningún pago para esta orden' }, { status: 409 });
        }

        let ipn = null;
        try { ipn = order.content ? JSON.parse(order.content) : null; } catch { ipn = null; }
        const amounts = saleAmounts(ipn, order.amount, order.currency);
        const admin = await getCurrentUser();
        const result = await repositoryPaymentOrder.complete(order.payment_order_id, order.payment_id, order.content ?? '', amounts);
        logger.warn(`/api/admin/payment-order ENTREGA MANUAL por admin=${admin?.user_id} order=${order.payment_order_id} payment=${order.payment_id} estado=${order.status} bruto=${amounts.gross} neto=${amounts.net} ${order.currency} ${result}`)

        if (result === 'already_completed') {
            return NextResponse.json({ success: false, message: 'Este pago ya se entregó' }, { status: 409 });
        }
        if (result === 'completed') {
            const buyer = await repositoryAuth.findUserById(order.user_id);
            if (buyer !== null) {
                void sendPurchaseMails(buyer, order.pack_code, {
                    method: 'nowpayments',
                    amount: amounts.gross.toFixed(2),
                    currency: order.currency,
                    reference: order.payment_id,
                })
            }
        }
        const resp: IResponse<{ result: string }> = {
            data: { result },
            message: result === 'already_owned' ? 'El usuario ya tenía el pack: se marcó el pago como completado sin crear otra compra' : 'Pack entregado',
            success: true,
        };
        return NextResponse.json(resp, { status: 200 });
    } catch (error) {
        logger.error(`/api/admin/payment-order POST ${jsonLog(error instanceof Error ? error.message : error)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}
