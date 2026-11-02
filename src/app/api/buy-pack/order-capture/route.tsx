import { repositoryBuyPack } from "@/src/app/repositories/buy-pack.repository";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { IPayPalConfirm } from "@/src/app/types/buy_pack.types";
import { getCurrentUser } from "@/src/app/utils/auth";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { describePayPalError, paypalPost } from "@/src/app/utils/paypal";
import { NextRequest, NextResponse } from "next/server";

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
        if (statusCapture === 201 || statusCapture === 200) {
            const pack = await repositoryPack.findPackInfo(code, user !== null)
            const buy = await repositoryBuyPack.create(
                pack!.pack_id,
                user.user_id,
                dataCapture.purchase_units[0].payments.captures[0].id,
                dataCapture.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.value,
                JSON.stringify(dataCapture)
            );
        }

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