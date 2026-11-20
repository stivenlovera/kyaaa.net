'use server';
import { z } from "zod";
import { getCurrentUser } from '../utils/auth';
import { IFieldsChangeProfile, IFormChangeProfile } from '../types/user.type';
import logger, { jsonLog } from "../utils/logger";
import { repositoryAuth } from "../repositories/auth.repository";
import { resizeProfileImage } from "../utils/sharp";
import { deleteMultipleObjects, uploadMultipleObjects } from "../utils/uploadS3";
import { sleep } from "../utils/other";

export async function actionFormChangeProfile(prevState: IFormChangeProfile, formData: FormData): Promise<IFormChangeProfile> {

    await sleep(5000);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png'];

    const name = formData.get('name');
    const nick = formData.get('nick');
    const image = formData.get('image')
    const file = formData.get('file') as File;

    logger.info(`actionFormChangeProfile ${jsonLog({ name, nick, image, file })}`)
    const fields: IFieldsChangeProfile = {
        name: name?.toString(),
        nick: nick?.toString(),
        image: image?.toString(),
        file: file
    }

    if (!name || !nick) {
        return {
            success: false,
            errors: {
                name: !name ? "Name es requerido" : null,
                nick: !nick ? "Nick es requerido" : null
            },
            fields: fields
        };
    }

    const nickSchema = z.string()
        .min(5, "Apodo debe ser mayor a 5 characteres")
        .max(100, "Apodo debe ser menor a 100 characteres");
    const validNick = nickSchema.safeParse(nick.toString());
    if (!validNick.success) {
        return {
            success: false,
            errors: {
                nick: validNick.error?.issues[0].message
            },
            fields: fields
        };
    }

    const user = await getCurrentUser();
    const exist = await repositoryAuth.findUserNick(nick.toString(), user!.user_id);
    if (exist !== null) {
        return {
            success: false,
            errors: {
                nick: "Nick ya existe"
            },
            fields: fields
        };
    }

    const nameSchema = z.string()
        .min(5, "Nombre debe ser mayor a 5 characteres")
        .max(200, "Nombre debe ser menor a 200 characteres");
    const validName = nameSchema.safeParse(name.toString());
    if (!validName.success) {
        return {
            success: false,
            errors: {
                name: validName.error?.issues[0].message
            },
            fields: fields
        };
    }

    let nameFile: string | null = null;
    if (file.size !== 0) {
        const fileSchema = z.object({
            file: z
                .any()
                .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
                .refine(
                    (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
                    '.jpg and .png formats are supported.'
                ),
        });
        const validFile = fileSchema.safeParse({ file });
        if (!validFile.success) {
            return {
                success: false,
                errors: {
                    file: validFile.error?.issues[0].message
                },
                fields: fields
            };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const bufferAVIF = await resizeProfileImage(buffer);
        nameFile = `${Date.now()}.avif`;
        await uploadMultipleObjects({ name: `${nameFile}`, path: `${nameFile}`, buffer: bufferAVIF })

        const userImage = await repositoryAuth.findUserById(user!.user_id)
        if ((userImage!.image!) !== "new_user.png") {
            await deleteMultipleObjects({ name: userImage!.image!, path: "" })
        }

        await repositoryAuth.updateImgProfile(user!.user_id, `${nameFile}`)
    }

    const update = repositoryAuth.updateUser(nick.toString(), user!.user_id, name.toString())
    if (update !== null) {
        return {
            success: true,
            errors: {},
            fields: fields
        };
    }

    return { success: true, fields: fields, errors: {} };
}