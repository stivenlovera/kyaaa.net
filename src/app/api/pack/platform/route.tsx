import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { repositoryPlatform } from "@/src/app/repositories/platform.repository";
import { IResponse } from "@/src/app/types/response";
import { deleteStaticObject, uploadStaticObject } from "@/src/app/utils/uploadS3";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../../generated/prisma/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
};

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

// Borra una imagen del bucket static sin cortar la petición si falla (queda huérfana y se registra).
async function removeImage(key: string) {
    try {
        await deleteStaticObject(key);
    } catch (error: any) {
        logger.error(`api/pack/platform no se pudo borrar la imagen ${key} error=> ${jsonLog(error.message)}`)
    }
}

// Crea o edita un póster de un pack (FormData: pack_platform_id solo al editar, pack_id, platform_id, url,
// title, sort, state y file). Un pack puede tener varios pósters en la misma plataforma, así que cada
// imagen va al bucket static con nombre propio: `packs/<code>/poster/<slug>-<timestamp>.<ext>`. Al editar
// la imagen es opcional; si llega una nueva, se borra la anterior.
export async function POST(request: NextRequest) {
    logger.info(`api/pack/platform POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const formData = await request.formData();
        const rawId = formData.get('pack_platform_id');
        const pack_platform_id = rawId === null || rawId === '' ? null : Number(rawId);
        const pack_id = Number(formData.get('pack_id'));
        const platform_id = Number(formData.get('platform_id'));
        const url = String(formData.get('url') ?? '').trim();
        const title = String(formData.get('title') ?? '').trim();
        const sort = Math.trunc(Number(formData.get('sort') ?? 0)) || 0;
        const state = formData.get('state') === '0' ? 0 : 1;
        const file = formData.get('file');

        if (pack_platform_id !== null && (!Number.isInteger(pack_platform_id) || pack_platform_id <= 0)) {
            return NextResponse.json({ success: false, message: 'pack_platform_id no válido' }, { status: 400 });
        }
        if (!isHttpUrl(url)) {
            return NextResponse.json({ success: false, message: 'El enlace debe ser una URL http(s) válida' }, { status: 400 });
        }
        const [pack, platform, existing] = await Promise.all([
            repositoryPack.findCodeById(pack_id),
            repositoryPlatform.findByIdWithState(platform_id),
            pack_platform_id === null ? Promise.resolve(null) : repositoryPlatform.findPosterById(pack_platform_id),
        ]);
        if (pack === null) {
            return NextResponse.json({ success: false, message: 'El pack no existe' }, { status: 404 });
        }
        if (pack_platform_id !== null && (existing === null || existing.pack_id !== pack_id)) {
            return NextResponse.json({ success: false, message: 'El póster ya no existe' }, { status: 404 });
        }
        // Una plataforma inactiva no admite pósters nuevos, pero sí editar los que ya están en ella.
        if (platform === null || (platform.state !== 1 && existing?.platform_id !== platform_id)) {
            return NextResponse.json({ success: false, message: 'La plataforma no existe' }, { status: 400 });
        }

        let poster: string | undefined;
        if (file instanceof File && file.size > 0) {
            const extension = EXTENSIONS[file.type];
            if (extension === undefined) {
                return NextResponse.json({ success: false, message: 'Formato no válido: usa JPG, PNG, WEBP o AVIF' }, { status: 400 });
            }
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({ success: false, message: 'La imagen supera los 5 MB' }, { status: 400 });
            }
            // Nombre único en cada subida: no pisa otros pósters de la misma plataforma y evita que la
            // caché (Cloudflare/navegador) sirva la imagen anterior.
            poster = `packs/${pack.code}/poster/${platform.slug}-${Date.now()}.${extension}`;
            await uploadStaticObject(poster, Buffer.from(await file.arrayBuffer()), file.type);
        } else if (existing === null) {
            return NextResponse.json({ success: false, message: 'Falta la imagen del póster' }, { status: 400 });
        }

        const fields = { platform_id, url, title: title === '' ? null : title, sort, state };
        if (existing === null) {
            await repositoryPlatform.createPoster({ pack_id, ...fields, poster: poster! });
        } else {
            await repositoryPlatform.updatePoster(pack_platform_id!, { ...fields, poster });
            if (poster !== undefined && existing.poster !== poster) {
                await removeImage(existing.poster);
            }
        }
        const resp: IResponse<boolean> = { data: true, message: 'Póster guardado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/pack/platform POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

// Quita el póster del pack y su imagen del bucket static.
export async function DELETE(request: NextRequest) {
    logger.info(`api/pack/platform DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const pack_platform_id = Number(request.nextUrl.searchParams.get('pack_platform_id'));
        if (!Number.isInteger(pack_platform_id) || pack_platform_id <= 0) {
            return NextResponse.json({ success: false, message: 'Falta pack_platform_id' }, { status: 400 });
        }
        const poster = await repositoryPlatform.delete(pack_platform_id);
        await removeImage(poster);
        const resp: IResponse<boolean> = { data: true, message: 'Póster eliminado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El póster ya no existe' }, { status: 404 });
        }
        logger.error(`api/pack/platform DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
