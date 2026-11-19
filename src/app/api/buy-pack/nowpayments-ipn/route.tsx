import { repositoryAuth } from "@/src/app/repositories/auth.repository";
import { repositoryPaymentOrder } from "@/src/app/repositories/payment-order.repository";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { INowPaymentsIpn, NOWPAYMENTS_STATUS, paidRatio, partialTolerance, verifyIpnSignature } from "@/src/app/utils/nowpayments";
import { sendPurchaseMails } from "@/src/app/utils/purchase-mails";
import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook (IPN) de NOWPayments. Es público: lo que lo protege es la firma x-nowpayments-sig.
 * Puede llegar varias veces y en cualquier orden, así que todo es idempotente.
 * Crea la compra con `finished`, o con `partially_paid` si lo recibido llega a la tolerancia
 * (NOWPAYMENTS_PARTIAL_TOLERANCE, por defecto 95 %): p. ej. cuando un exchange descuenta su comisión de retiro.
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

        const isFinished = payload.payment_status === NOWPAYMENTS_STATUS.FINISHED;
        const isPartial = payload.payment_status === NOWPAYMENTS_STATUS.PARTIALLY_PAID;
        // Fracción del precio que pagó el comprador (ver paidRatio). 1 si no es un parcial.
        const ratio = isPartial ? paidRatio(payload) : 1;

        if (!isFinished && !(isPartial && ratio !== null && ratio >= partialTolerance())) {
            await repositoryPaymentOrder.updateStatus(order.payment_order_id, payload.payment_status, paymentId, raw);
            if (isPartial) {
                // Falta demasiado: no se da el pack; hay que resolverlo a mano (que envíe la diferencia o devolverlo).
                logger.warn(`/api/buy-pack/nowpayments-ipn PAGO PARCIAL order=${order.payment_order_id} payment=${paymentId} recibido=${ratio === null ? '?' : (ratio * 100).toFixed(1) + '%'} pay_amount=${payload.pay_amount} actually_paid=${payload.actually_paid} ${payload.pay_currency ?? ''} actually_paid_at_fiat=${payload.actually_paid_at_fiat} price_amount=${payload.price_amount}`)
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

        // Bruto: lo que pagó realmente (en un parcial aceptado, la parte proporcional del precio).
        const gross = Math.round(price * Math.min(ratio ?? 1, 1) * 100) / 100;
        if (isPartial) {
            logger.warn(`/api/buy-pack/nowpayments-ipn PARCIAL ACEPTADO order=${order.payment_order_id} payment=${paymentId} recibido=${((ratio ?? 1) * 100).toFixed(1)}% bruto=${gross} ${order.currency}`)
        }

        const result = await repositoryPaymentOrder.complete(order.payment_order_id, paymentId, raw, { gross, currency: order.currency });
        logger.info(`/api/buy-pack/nowpayments-ipn order=${order.payment_order_id} ${result}`)
        if (result === 'already_owned') {
            logger.warn(`/api/buy-pack/nowpayments-ipn COBRADO DOS VECES: el usuario ${order.user_id} ya tenía el pack ${order.pack_code} (order=${order.payment_order_id}, payment=${paymentId})`)
        }
        if (result === 'completed') {
            const buyer = await repositoryAuth.findUserById(order.user_id);
            if (buyer !== null) {
                void sendPurchaseMails(buyer, order.pack_code, {
                    method: 'nowpayments',
                    amount: gross.toFixed(2),
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
