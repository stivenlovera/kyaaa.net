import { repositoryAuth } from "@/src/app/repositories/auth.repository";
import { repositoryPaymentOrder } from "@/src/app/repositories/payment-order.repository";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { INowPaymentsIpn, NOWPAYMENTS_STATUS, verifyIpnSignature } from "@/src/app/utils/nowpayments";
import { sendPurchaseMails } from "@/src/app/utils/purchase-mails";
import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook (IPN) de NOWPayments. Es público: lo que lo protege es la firma x-nowpayments-sig.
 * Puede llegar varias veces y en cualquier orden, así que todo es idempotente. Solo `finished` crea la compra.
 * Responde 200 a todo aviso con firma válida (aunque se ignore) para que NOWPayments no lo reintente.
 */
export async function POST(request: NextRequest) {
    let payload: INowPaymentsIpn;
    const raw = await request.text();
    try {
        payload = JSON.parse(raw);
    } catch {
        logger.warn(`/api/buy-pack/nowpayments-ipn cuerpo no es JSON`)
        return NextResponse.json({ success: false }, { status: 400 });
    }

    if (!verifyIpnSignature(payload, request.headers.get('x-nowpayments-sig'))) {
        logger.warn(`/api/buy-pack/nowpayments-ipn firma inválida order=${jsonLog(payload?.order_id)} payment=${jsonLog(payload?.payment_id)}`)
        return NextResponse.json({ success: false }, { status: 401 });
    }

    const paymentId = String(payload.payment_id);
    logger.info(`/api/buy-pack/nowpayments-ipn order=${payload.order_id} payment=${paymentId} status=${payload.payment_status}`)

    try {
        const orderId = Number(payload.order_id);
        const order = Number.isInteger(orderId) ? await repositoryPaymentOrder.findById(orderId) : null;
        if (order === null) {
            logger.error(`/api/buy-pack/nowpayments-ipn orden desconocida ${jsonLog(payload)}`)
            return NextResponse.json({ success: true }, { status: 200 });
        }

        if (payload.payment_status !== NOWPAYMENTS_STATUS.FINISHED) {
            await repositoryPaymentOrder.updateStatus(order.payment_order_id, payload.payment_status, paymentId, raw);
            if (payload.payment_status === NOWPAYMENTS_STATUS.PARTIALLY_PAID) {
                // El comprador mandó menos de lo debido: no se da el pack; hay que resolverlo a mano desde el panel de NOWPayments.
                logger.warn(`/api/buy-pack/nowpayments-ipn PAGO PARCIAL order=${order.payment_order_id} payment=${paymentId} ${jsonLog(payload)}`)
            }
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // El importe y la moneda tienen que ser los de la orden (el precio de la BD al crear el invoice).
        const price = Number(payload.price_amount);
        if (String(payload.price_currency).toUpperCase() !== order.currency || !(price + 0.005 >= order.amount)) {
            await repositoryPaymentOrder.updateStatus(order.payment_order_id, 'amount_mismatch', paymentId, raw);
            logger.error(`/api/buy-pack/nowpayments-ipn IMPORTE NO COINCIDE order=${order.payment_order_id} esperado=${order.amount} ${order.currency} ${jsonLog(payload)}`)
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const result = await repositoryPaymentOrder.complete(order.payment_order_id, paymentId, raw, { gross: price, currency: order.currency });
        logger.info(`/api/buy-pack/nowpayments-ipn order=${order.payment_order_id} ${result}`)
        if (result === 'already_owned') {
            logger.warn(`/api/buy-pack/nowpayments-ipn COBRADO DOS VECES: el usuario ${order.user_id} ya tenía el pack ${order.pack_code} (order=${order.payment_order_id}, payment=${paymentId})`)
        }
        if (result === 'completed') {
            const buyer = await repositoryAuth.findUserById(order.user_id);
            if (buyer !== null) {
                void sendPurchaseMails(buyer, order.pack_code, {
                    method: 'nowpayments',
                    amount: price.toFixed(2),
                    currency: order.currency,
                    reference: paymentId,
                })
            }
        }
        return NextResponse.json({ success: true }, { status: 200 });
    }
    catch (error) {
        // 500: NOWPayments puede reintentar el aviso; el pago queda registrado en este log.
        logger.error(`/api/buy-pack/nowpayments-ipn ERROR order=${payload.order_id} payment=${paymentId} status=${payload.payment_status} ${jsonLog(error instanceof Error ? error.message : error)}`)
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
