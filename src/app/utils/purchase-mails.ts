import { repositoryPack } from "../repositories/pack.repository";
import logger, { jsonLog } from "./logger";
import { sendEmail } from "./mail";
import { PurchaseMailData, purchaseConfirmationHtml, saleStaffHtml } from "./template-mails/notification-purchase-html";

// Correos tras una compra (PayPal o NOWPayments) o un canje de cupón. Se llaman sin await: la compra ya está guardada y
// un fallo del SMTP no debe afectar a la respuesta; los errores quedan en el log.

interface Buyer {
    name: string
    nick: string
    email: string
}

const safeSend = async (label: string, to: string, subject: string, html: string) => {
    try {
        await sendEmail(to, subject, to, html);
    } catch (error) {
        logger.error(`purchase-mails ${label} ${jsonLog(error)}`);
    }
};

export async function sendPurchaseMails(buyer: Buyer, packCode: string, data: Omit<PurchaseMailData, 'pack'>): Promise<void> {
    try {
        // Primera página gratis en tamaño medium del bucket público (censurada): el correo se abre fuera de la web.
        const meta = await repositoryPack.findPackEmail(packCode);
        const mail: PurchaseMailData = { ...data, pack: { code: packCode, name: meta?.name ?? packCode, image: meta?.image ?? null } };
        const isCoupon = data.method === 'coupon';

        await safeSend(
            'buyer',
            buyer.email,
            isCoupon ? `Cupón canjeado: ${mail.pack.name}` : `Tu compra en kyaaa: ${mail.pack.name}`,
            purchaseConfirmationHtml(buyer.name, mail),
        );
        const sales = process.env.SALES_EMAIL;
        if (sales) {
            await safeSend(
                'sales',
                sales,
                isCoupon ? `[Ventas] Cupón canjeado: ${mail.pack.name}` : `[Ventas] Nueva venta: ${mail.pack.name} (${data.amount ?? ''} ${data.currency ?? ''})`.trim(),
                saleStaffHtml({ nick: buyer.nick, email: buyer.email }, mail),
            );
        }
    } catch (error) {
        logger.error(`purchase-mails ${jsonLog(error)}`);
    }
}
