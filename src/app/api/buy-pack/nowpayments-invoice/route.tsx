import { repositoryBuyPack } from "@/src/app/repositories/buy-pack.repository";
import { repositoryPage } from "@/src/app/repositories/pages.repository";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { repositoryPaymentOrder } from "@/src/app/repositories/payment-order.repository";
import { getCurrentUser } from "@/src/app/utils/auth";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { createInvoice, describeNowPaymentsError } from "@/src/app/utils/nowpayments";
import { routing } from "@/src/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const CURRENCY = 'USD';

/**
 * Abre un pago con criptomonedas: guarda la orden en payment_order, crea el invoice en NOWPayments y
 * devuelve su URL (el navegador redirige allí). La compra se registra después, en el webhook (nowpayments-ipn).
 */
export async function POST(request: NextRequest) {
    try {
        const { code, locale }: { code: string, locale?: string } = await request.json();
        logger.info(`/api/buy-pack/nowpayments-invoice POST code ${jsonLog(code)}`)

        const user = await getCurrentUser();
        if (user === null) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const pack = await repositoryPack.findPackInfo(code, true);
        if (pack === null) {
            return NextResponse.json({ success: false, message: 'Pack no encontrado' }, { status: 404 });
        }
        if (await repositoryBuyPack.verfiedLikeForUser(user.user_id, pack.pack_id) !== null) {
            return NextResponse.json({ success: false, message: 'Ya compraste este pack' }, { status: 409 });
        }
        if (await repositoryPage.isFreeForRegistered(pack.pack_id)) {
            return NextResponse.json({ success: false, message: 'Este pack es gratis para usuarios registrados' }, { status: 409 });
        }

        // Precio de la BD, nunca el del navegador.
        const order = await repositoryPaymentOrder.create(user.user_id, pack.pack_id, pack.price_list, CURRENCY);

        const site = process.env.URL_BASE ?? '';
        const prefix = locale && locale !== routing.defaultLocale && (routing.locales as readonly string[]).includes(locale) ? `/${locale}` : '';
        const invoice = await createInvoice({
            price_amount: pack.price_list,
            price_currency: CURRENCY.toLowerCase(),
            order_id: String(order.payment_order_id),
            order_description: `kyaaa ${pack.name} (${pack.code})`,
            ipn_callback_url: `${site}/api/buy-pack/nowpayments-ipn`,
            success_url: `${site}${prefix}/buy/${pack.code}/crypto?order=${order.payment_order_id}`,
            cancel_url: `${site}${prefix}/buy/${pack.code}`,
            // Sin is_fixed_rate: el tipo fijo sube el mínimo de NOWPayments a ~7 USD en todas las redes
            // (USDT BSC → USDT BSC: 0.07 USD sin él, 6.72 con él) y los packs de 5 USD fallaban con
            // "amountTo is too small". Los desfases pequeños los cubren la tolerancia del webhook y la
            // "Cobertura del pago" del panel de NOWPayments.
        });
        await repositoryPaymentOrder.setExternalId(order.payment_order_id, String(invoice.id));
        logger.info(`/api/buy-pack/nowpayments-invoice POST order=${order.payment_order_id} invoice=${invoice.id}`)

        return NextResponse.json({ success: true, message: 'Invoice creado', data: { url: invoice.invoice_url, order: order.payment_order_id } }, { status: 200 });
    }
    catch (error) {
        logger.error(`/api/buy-pack/nowpayments-invoice POST ${jsonLog(describeNowPaymentsError(error))}`)
        return NextResponse.json({ success: false, message: 'No se pudo crear el pago con cripto' }, { status: 500 });
    }
}
