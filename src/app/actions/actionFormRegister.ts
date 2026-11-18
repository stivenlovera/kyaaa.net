'use server';
import { z } from "zod";
import { repositoryAuth } from "../repositories/auth.repository";
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '../utils/auth';
import { IFieldsFormRegister, IFormRegister, JWTPayload } from '../types/user.type';
import logger, { jsonLog } from "../utils/logger";
import { sendEmail } from "../utils/mail";
import { welcomeEmailHtml } from "../utils/template-mails/notification-welcome-html";

export async function actionFormRegister(prevState: IFormRegister, formData: FormData): Promise<IFormRegister> {
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirm_password = formData.get('confirm_password');
    const term_use = formData.get('term_use');

    const fields: IFieldsFormRegister = {
        name: name?.toString(),
        email: email?.toString(),
        password: password?.toString(),
        confirm_password: confirm_password?.toString(),
        term_use: term_use?.toString() === 'on' ? true : false,
    }

    if (!name || !email || !password || !confirm_password) {
        return {
            success: false,
            errors: {
                name: !name ? "Name es requerido" : null,
                email: !email ? "Email es requerido" : null,
                password: !password ? "Contraseña es requerido" : null,
                confirm_password: !password ? "Repita contraseña" : null,
                term_use: !password ? "Marca aceptar lo termino de uso" : null,
            },
            fields: fields
        };
    }

    const emailSchema = z.email();
    const result = emailSchema.safeParse(email.toString());

    if (!result.success) {
        return {
            success: false,
            errors: {
                email: "email no valido"
            },
            fields: fields
        };
    }

    if (password.toString().length < 5 || password.toString().length > 100) {
        return {
            success: false,
            errors: {
                password: "Contraseña debe ser mayor 5 y menor 100 caracteres"
            },
            fields: fields
        };
    }

    if (password.toString() !== confirm_password.toString()) {
        return {
            success: false,
            errors: {
                confirm_password: "Contraseña no coincide"
            },
            fields: fields
        };
    }

    if (term_use?.toString() !== 'on') {
        return {
            success: false,
            errors: {
                term_use: "Marca para aceptar terminos de uso"
            },
            fields: fields
        };
    }

    const valid = await repositoryAuth.findUserByEmail(email.toString());
    if (valid !== null) {
        return {
            success: false,
            errors: {
                email: "Email ya esta en uso"
            },
            fields: fields
        };
    }

    const user = await repositoryAuth.createUser(name.toString(), email.toString(), password.toString());

    const payload: JWTPayload = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: 'user'
    };

    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    // Set mail
    const infoEmail = await sendEmail(user!.email!, '¡Bienvenido a kyaaa!', user!.name, welcomeEmailHtml(user!.name));
    logger.info(`info sendEmail ${jsonLog(infoEmail)}`)

    // Set cookies
    await setAuthCookies(accessToken, refreshToken);

    return { success: true, fields: fields, errors: {} };
}