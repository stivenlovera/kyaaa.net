'use server';
import { generateAccessTokenTemp, getCurrentUser } from "../utils/auth";
import logger, { jsonLog } from "../utils/logger";
import { sendEmail } from "../utils/mail";
import { verifiedEmailHtml } from "../utils/template-mails/notification-verification-email-html";

export async function actionFormVerifiedEmail(prevState: { success: boolean }, formData: FormData): Promise<{ success: boolean }> {
    logger.info(`actionFormVerifiedEmail ${jsonLog({ formData })}`)
    const user = await getCurrentUser()
    if (user === null) {
        return { success: false };
    }
    try {
        const accessToken = await generateAccessTokenTemp({
            email: user.email,
        });
        const url = `${process.env.URL_BASE}/verified-email?code_verified=${accessToken}`;

        logger.info(`info sendEmail ${jsonLog(url)}`)
        const infoEmail = await sendEmail(user.email, 'Verifica tu email en kyaaa', user.name, verifiedEmailHtml(user.name, url));
        logger.info(`info sendEmail ${jsonLog(infoEmail)}`)
        return { success: true };
    } catch (error) {
        // Sin esto, un fallo del SMTP rompía la server action y el modal se quedaba sin respuesta.
        logger.error(`actionFormVerifiedEmail sendEmail ${jsonLog(error)}`)
        return { success: false };
    }
}
