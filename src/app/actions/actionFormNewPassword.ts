'use server';
import { z } from "zod";
import { IFieldsFormNewPassword, IFormNewPassword } from "../types/user.type";
import { verifyAccessTokenTemp } from "../utils/auth";
import logger, { jsonLog } from "../utils/logger";
import { sendEmail } from "../utils/mail";
import { repositoryAuth } from "../repositories/auth.repository";
import { notificationUpdatePasswordHtml } from "../utils/template-mails/notification-new-password-html";

export async function actionFormNewPassword(prevState: IFormNewPassword, formData: FormData): Promise<IFormNewPassword> {
    const code = formData.get('code');
    const new_password = formData.get('new_password');
    const confirm_password = formData.get('new_password');

    logger.info(`actionFormUpdatePassword ${jsonLog([code, new_password, confirm_password])}`)
    const fields: IFieldsFormNewPassword = {
        code: code?.toString(),
        new_password: new_password?.toString(),
        confirm_password: confirm_password?.toString(),
    }

    const newPasswordSchema = z.string()
        .min(5, "Contraseña debe ser mayor a 5 characteres")
        .max(20, "Contraseña debe ser menor a 20 characteres");;
    const validNewPassword = newPasswordSchema.safeParse(new_password?.toString());
    if (!validNewPassword.success) {
        return {
            success: false,
            errors: {
                new_password: validNewPassword.error?.issues[0].message
            },
            fields: fields
        };
    }

    const confirmPasswordSchema = z.string()
        .min(5, "Contraseña debe ser mayor a 5 characteres")
        .max(20, "Contraseña debe ser menor a 20 characteres");;
    const validConfirmPassword = confirmPasswordSchema.safeParse(confirm_password?.toString());
    if (!validConfirmPassword.success) {
        return {
            success: false,
            errors: {
                confirm_password: validConfirmPassword.error?.issues[0].message
            },
            fields: fields
        };
    }

    if (confirm_password!.toString() !== new_password!.toString()) {
        return {
            success: false,
            errors: {
                new_password: "Contraseña no coincide"
            },
            fields: fields
        };
    }

    const validUser = await verifyAccessTokenTemp(code!.toString());
    logger.info(`info validUser ${jsonLog(validUser)}`)
    if (validUser === null) {
        return {
            success: false,
            errors: {
                new_password: "Enlace vencido",
                confirm_password: "Enlace vencido"
            },
            fields: fields
        };
    }
    const user = await repositoryAuth.findEmail(validUser!.email)
    await repositoryAuth.updateResetPassword(validUser!.email, new_password!.toString())

    const infoPassword = await sendEmail(user!.email, 'Tu contraseña de kyaaa se ha actualizado', user!.name, notificationUpdatePasswordHtml({ name: user!.name, email: user!.email, via: 'reset' }));
    logger.info(`info infoPassword ${jsonLog(infoPassword)}`)

    return { success: true, fields: fields, errors: {} };
}