'use server';
import { z } from "zod";
import { IFieldsFormUpdatePassword, IFormUpdatePassword } from "../types/user.type";
import { getCurrentUser } from "../utils/auth";
import logger, { jsonLog } from "../utils/logger";
import { sendEmail } from "../utils/mail";
import { repositoryAuth } from "../repositories/auth.repository";
import { notificationUpdatePasswordHtml } from "../utils/template-mails/notification-new-password-html";

export async function actionFormUpdatePassword(prevState: IFormUpdatePassword, formData: FormData): Promise<IFormUpdatePassword> {

    const user = await getCurrentUser()

    const current_password = formData.get('current_password');
    const new_password = formData.get('new_password');
    const confirm_password = formData.get('new_password');

    logger.info(`actionFormUpdatePassword ${jsonLog([current_password, new_password, confirm_password, user])}`)
    const fields: IFieldsFormUpdatePassword = {
        current_password: current_password?.toString(),
        new_password: new_password?.toString(),
        confirm_password: confirm_password?.toString(),
    }

    const passwordSchema = z.string()
        .min(5, "Contraseña debe ser mayor a 5 characteres")
        .max(20, "Contraseña debe ser menor a 20 characteres");;
    const validPassword = passwordSchema.safeParse(current_password?.toString());
    if (!validPassword.success) {
        return {
            success: false,
            errors: {
                current_password: validPassword.error?.issues[0].message
            },
            fields: fields
        };
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

    const validUser = await repositoryAuth.verifyPassword(current_password!.toString(), user!.password!);
    if (!validUser) {
        return {
            success: false,
            errors: {
                current_password: "Contraseña invalida"
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

    if (current_password!.toString() === new_password!.toString()) {
        return {
            success: false,
            errors: {
                new_password: "Contraseña es igual a la anterior"
            },
            fields: fields
        };
    }

    await repositoryAuth.updatePassword(user!.user_id, new_password!.toString())

    const infoPassword = await sendEmail(user!.email!, 'Tu contraseña de kyaaa se ha actualizado', user!.name, notificationUpdatePasswordHtml({ name: user!.name, email: user!.email!, via: 'account' }));
    logger.info(`info infoPassword ${jsonLog(infoPassword)}`)

    return { success: true, fields: fields, errors: {} };
}