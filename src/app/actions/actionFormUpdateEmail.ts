'use server';
import { z } from "zod";
import { IFieldsFormUpdateEmail, IFormUpdateEmail } from "../types/user.type";
import { getCurrentUser } from "../utils/auth";
import logger, { jsonLog } from "../utils/logger";
import { sendEmail } from "../utils/mail";
import { repositoryAuth } from "../repositories/auth.repository";
import { notificationNewEmailHtml } from "../utils/template-mails/notification-new-email.html";
import { notificationBeforeEmailHtml } from "../utils/template-mails/notification-before-email.html";

export async function actionFormUpdateEmail(prevState: IFormUpdateEmail, formData: FormData): Promise<IFormUpdateEmail> {
    logger.info(`actionFormUpdateEmail ${jsonLog({ formData })}`)

    const user = await getCurrentUser()

    const new_email = formData.get('new_email');
    const email = formData.get('email');

    const fields: IFieldsFormUpdateEmail = {
        new_email: new_email?.toString(),
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

    if (user?.email !== email) {
        return {
            success: false,
            errors: {
                email: 'Email no valido'
            },
            fields: fields
        };
    }

    if (email?.toString() === new_email?.toString()) {
        return {
            success: false,
            errors: {
                new_email: 'Email son iguales'
            },
            fields: fields
        };
    }

    const new_emailSchema = z.email('Debe ser un email valido');
    const validNewEmail = new_emailSchema.safeParse(new_email!);
    if (!validNewEmail.success) {
        return {
            success: false,
            errors: {
                new_email: validNewEmail.error?.issues[0].message
            },
            fields: fields
        };
    }

    const existEmail = await repositoryAuth.findUserEmail(new_email!.toString(), user?.user_id);

    if (existEmail === null) {
        await repositoryAuth.updateEmail(user.user_id, new_email!.toString())

        const infoEmail = await sendEmail(user!.email!, 'El email de tu cuenta de kyaaa ha cambiado', user!.name, notificationBeforeEmailHtml(user!.name, new_email!.toString()));
        const infoNewEmail = await sendEmail(new_email!.toString(), 'Tu nuevo email en kyaaa', user!.name, notificationNewEmailHtml(user!.name));
        logger.info(`info infoEmail ${jsonLog(infoEmail)}`)
        logger.info(`info infoNewEmail ${jsonLog(infoNewEmail)}`)
    } else {
        return {
            success: false,
            errors: {
                new_email: "Email ya fue registrado"
            },
            fields: fields
        };
    }

    return { success: true, fields: fields, errors: {} };
}