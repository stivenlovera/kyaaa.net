import { repositoryBuyPack } from "@/src/app/repositories/buy-pack.repository";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { IPayPalConfirm } from "@/src/app/types/buy_pack.types";
import { getCurrentUser } from "@/src/app/utils/auth";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { describePayPalError, paypalPost } from "@/src/app/utils/paypal";
import { NextRequest, NextResponse } from "next/server";
import { sendPurchaseMails } from "@/src/app/utils/purchase-mails";

export async function POST(request: NextRequest) {
    logger.info(`/api/buy-pack/order-capture POST `)
    try {
        const { order_id, code }: { order_id: string, code: string } = await request.json();

        const user = await getCurrentUser();
        if (user === null) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        logger.info(`/api/buy-pack/order-capture POST user ${jsonLog(user)}`)
        const { data: dataCapture, status: statusCapture } = await paypalPost<IPayPalConfirm>(`/v2/checkout/orders/${order_id}/capture`, {})
        logger.info(`/api/buy-pack/order-capture POST pago ${jsonLog(statusCapture)}`)
        logger.info(`/api/buy-pack/order-capture POST pago ${jsonLog(dataCapture)}`)
        const capture = dataCapture?.purchase_units?.[0]?.payments?.captures?.[0]
        // Antes se respondía "compra realizada" aunque PayPal no hubiera capturado el pago (y la compra no
        // se guardaba): el usuario veía el modal de gracias sin tener el pack.
        if ((statusCapture !== 201 && statusCapture !== 200) || capture === undefined) {
            logger.error(`/api/buy-pack/order-capture POST captura no completada status=${statusCapture} order=${order_id}`)
            return NextResponse.json(
                { success: false, message: 'No se pudo confirmar el pago' },
                // 500 y no 502: Cloudflare reemplaza los 502 del origen por su propia página.
                { status: 500 }
            );
        }
        if (capture.status !== 'COMPLETED') {
            // PENDING (p. ej. revisión de PayPal): se da acceso igual que antes, pero queda registrado.
            logger.warn(`/api/buy-pack/order-capture POST captura en estado ${capture.status} order=${order_id}`)
        }
        // PayPal no siempre manda el desglose: falta en capturas PENDING y paypal_fee falta si no hubo comisión.
        // Antes eso lanzaba un TypeError DESPUÉS de cobrar y la compra no se guardaba.
        const breakdown = capture.seller_receivable_breakdown
        const gross = breakdown?.gross_amount?.value ?? capture.amount.value
        const fee = breakdown?.paypal_fee?.value ?? '0'
        const amounts = {
            gross,
            fee,
            net: breakdown?.net_amount?.value ?? (parseFloat(gross) - parseFloat(fee)).toFixed(2),
            currency: breakdown?.gross_amount?.currency_code ?? capture.amount.currency_code,
        }
        try {
            const pack = await repositoryPack.findPackInfo(code, true)
            if (pack === null) {
                throw new Error(`pack ${code} no encontrado`)
            }
            await repositoryBuyPack.create(pack.pack_id, user.user_id, capture.id, amounts, JSON.stringify(dataCapture));
        } catch (error) {
            // El pago YA está cobrado: este log es lo que hace falta para registrar la compra a mano.
            logger.error(`/api/buy-pack/order-capture POST COBRADO SIN GUARDAR user=${user.user_id} code=${code} capture=${capture.id} amounts=${jsonLog(amounts)} ${jsonLog(describePayPalError(error))}`)
            throw error
        }
        // Sin await: el correo no debe retrasar la respuesta; sendPurchaseMails registra los fallos.
        void sendPurchaseMails(user, code, {
            method: 'paypal',
            // En el correo, lo que pagó el comprador (bruto).
            amount: capture.amount.value,
            currency: capture.amount.currency_code,
            reference: capture.id,
        })

        return NextResponse.json(
            {
                success: true,
                message: "Payment successfully",
                data: "compra realizada"
            },
            { status: 200 }
        );
    }
    catch (error: any) {
        logger.error(`/api/buy-pack/order-capture POST ${jsonLog(describePayPalError(error))}`)
        return NextResponse.json(
            { success: false, message: 'No se pudo confirmar el pago' },
            { status: 500 }
        );
    }
}