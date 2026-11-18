'use server';
import { z } from "zod";
import { IFieldsFormResetPassword, IFormResetPassword } from "../types/user.type";
import { generateAccessTokenTemp } from "../utils/auth";
import logger, { jsonLog } from "../utils/logger";
import { sendEmail } from "../utils/mail";
import { repositoryAuth } from "../repositories/auth.repository";
import { notificationResetPasswordHtml } from "../utils/template-mails/notification-reset-password-html";

export async function actionFormResetPassword(prevState: IFormResetPassword, formData: FormData): Promise<IFormResetPassword> {
    logger.info(`actionFormResetPassword ${jsonLog({ formData })}`)

    const email = formData.get('email');

    const fields: IFieldsFormResetPassword = {
        email: email?.toString(),
    }

    const emailSchema = z.email('Debe ser un email valido');
    const validEmail = emailSchema.safeParse(email!);
    if (!validEmail.success) {
        return {
            success: false,
            errors: {
                email: validEmail.error?.issues[0].message
            },
            fields: fields
        };
    }

    const getUser = await repositoryAuth.findEmail(email!.toString())

    if (getUser === null) {
        return {
            success: false,
            errors: {
                email: "Email no es valido"
            },
            fields: fields
        };
    }

    const accessToken = await generateAccessTokenTemp({
        email: getUser!.email,
    });
    const url = `${process.env.URL_BASE}/reset-password?code=${accessToken}`;

    const infoEmail = await sendEmail(email!.toString(), 'Recupera tu contraseña de kyaaa', getUser!.name, notificationResetPasswordHtml(getUser!.name, url));
    logger.info(`info infoEmail ${jsonLog(infoEmail)}`)
    return { success: true, fields: fields, errors: {} };
}