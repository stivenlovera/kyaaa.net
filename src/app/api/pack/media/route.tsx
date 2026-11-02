import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { PACK_MEDIA_FIELDS, PackMediaField } from "@/src/app/types/pack.types";
import { IResponse } from "@/src/app/types/response";
import { packMediaUrl } from "@/src/app/utils/pack-images";
import { uploadStaticObject } from "@/src/app/utils/uploadS3";
import logger, { jsonLog } from "@/src/app/utils/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
};

// Sube una imagen de los modales del pack (FormData: pack_id, field, file) al bucket static, en
// `packs/<code>/<field>.<ext>`, y guarda esa key en la columna `field` del pack.
export async function POST(request: NextRequest) {
    logger.info(`api/pack/media POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const formData = await request.formData();
        const pack_id = Number(formData.get('pack_id'));
        const field = formData.get('field') as PackMediaField;
        const file = formData.get('file');

        if (!PACK_MEDIA_FIELDS.includes(field)) {
            return NextResponse.json({ success: false, message: 'Campo de imagen no válido' }, { status: 400 });
        }
        if (!(file instanceof File) || file.size === 0) {
            return NextResponse.json({ success: false, message: 'Falta la imagen' }, { status: 400 });
        }
        const extension = EXTENSIONS[file.type];
        if (extension === undefined) {
            return NextResponse.json({ success: false, message: 'Formato no válido: usa JPG, PNG, WEBP o AVIF' }, { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ success: false, message: 'La imagen supera los 5 MB' }, { status: 400 });
        }
        const pack = await repositoryPack.findCodeById(pack_id);
        if (pack === null) {
            return NextResponse.json({ success: false, message: 'El pack no existe' }, { status: 404 });
        }

        const key = `packs/${pack.code}/${field}.${extension}`;
        await uploadStaticObject(key, Buffer.from(await file.arrayBuffer()), file.type);
        // ?v= cambia la URL en cada subida para que la caché (Cloudflare/navegador) no sirva la imagen anterior.
        const stored = `${key}?v=${Date.now()}`;
        await repositoryPack.updateMedia(pack_id, field, stored);

        const resp: IResponse<string> = { data: packMediaUrl(stored)!, message: 'Imagen subida', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/pack/media POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
