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
 *
 * Con `action: 'refund'` marca la orden como devuelta (con el TxID de la devolución, hecha fuera de kyaaa.net):
 * no mueve dinero, no entrega el pack y el webhook ignora los avisos posteriores de esa orden.
 */
export async function POST(request: NextRequest) {
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { payment_order_id?: number, action?: string, txid?: string, note?: string } = await request.json();
        const { payment_order_id } = body;
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
        if (order.refunded_at !== null) {
            return NextResponse.json({ success: false, message: 'Este pago ya está marcado como devuelto' }, { status: 409 });
        }

        if (body.action === 'refund') {
            const txid = typeof body.txid === 'string' ? body.txid.trim() : '';
            const note = typeof body.note === 'string' && body.note.trim() !== '' ? body.note.trim() : null;
            if (txid === '' || txid.length > 150) {
                return NextResponse.json({ success: false, message: 'Indica el TxID de la devolución (máx. 150 caracteres)' }, { status: 400 });
            }
            if (note !== null && note.length > 250) {
                return NextResponse.json({ success: false, message: 'La nota no puede pasar de 250 caracteres' }, { status: 400 });
            }
            const marked = await repositoryPaymentOrder.markRefunded(order.payment_order_id, txid, note);
            const admin = await getCurrentUser();
            logger.warn(`/api/admin/payment-order DEVOLUCIÓN MANUAL por admin=${admin?.user_id} order=${order.payment_order_id} payment=${order.payment_id} estado=${order.status} txid=${jsonLog(txid)} nota=${jsonLog(note)} ${marked ? 'ok' : 'no marcada'}`)
            if (!marked) {
                return NextResponse.json({ success: false, message: 'No se pudo marcar: el pago cambió mientras tanto. Recarga la página.' }, { status: 409 });
            }
            const resp: IResponse<{ result: string }> = { data: { result: 'refunded' }, message: 'Pago marcado como devuelto', success: true };
            return NextResponse.json(resp, { status: 200 });
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
