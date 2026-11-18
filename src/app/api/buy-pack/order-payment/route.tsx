import { IPayPalCheckOrder } from "@/src/app/types/buy_pack.types";
import { repositoryBuyPack } from "@/src/app/repositories/buy-pack.repository";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { getCurrentUser } from "@/src/app/utils/auth";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { describePayPalError, paypalPost } from "@/src/app/utils/paypal";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    logger.info(`api/buy-pack/order-payment POST `)
    try {
        const { code }: { code: string } = await request.json();
        logger.info(`/api/buy-pack/order-payment POST code ${jsonLog(code)} `)

        const user = await getCurrentUser();

        if (user === null) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Segunda barrera contra pagar dos veces el mismo pack (la página /buy ya redirige si está comprado).
        const pack = await repositoryPack.findPackInfo(code, true);
        if (pack === null) {
            return NextResponse.json(
                { success: false, message: 'Pack no encontrado' },
                { status: 404 }
            );
        }
        if (await repositoryBuyPack.verfiedLikeForUser(user.user_id, pack.pack_id) !== null) {
            return NextResponse.json(
                { success: false, message: 'Ya compraste este pack' },
                { status: 409 }
            );
        }

        const { data: dataOrder } = await paypalPost<IPayPalCheckOrder>('/v2/checkout/orders', {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        // Precio de la BD, nunca el que manda el navegador (se podía cambiar y pagar menos).
                        value: pack.price_list.toFixed(2)
                    }
                }
            ]
        })
        logger.info(`/api/buy-pack/order-payment POST order ${jsonLog(dataOrder)}`)

        return NextResponse.json(
            {
                success: true,
                message: "Added successfully",
                data: dataOrder
            },
            { status: 200 }
        );
    }
    catch (error: any) {
        const detail = describePayPalError(error)
        logger.error(`/api/buy-pack/order-payment POST ${jsonLog(detail)}`)
        // 500 y no 502: Cloudflare reemplaza los 502 del origen por su propia página y el cliente no veía este JSON.
        // Se devuelve el debug id de PayPal (no es secreto) para poder buscar el error en los logs o en PayPal.
        return NextResponse.json(
            { success: false, message: 'No se pudo crear la orden de pago', debug_id: 'debug_id' in detail ? detail.debug_id : undefined },
            { status: 500 }
        );
    }
}
