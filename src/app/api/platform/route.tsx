import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryPlatform } from "@/src/app/repositories/platform.repository";
import { IAdminPlatform, IFormPlatform } from "@/src/app/types/platform.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../generated/prisma/client";

// Catálogo de plataformas (Ko-fi, Patreon…) donde se publican los pósters de los packs.
// Los pósters de cada pack se gestionan aparte, en /api/pack/platform.

const isHttpUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

const validate = (body: Partial<IFormPlatform>): string | null => {
    if (!body.name || body.name.trim() === '') {
        return 'El nombre es obligatorio';
    }
    if (body.name.trim().length > 100) {
        return 'El nombre no puede superar los 100 caracteres';
    }
    if (!body.slug || body.slug.trim() === '') {
        return 'El slug es obligatorio';
    }
    if (body.slug.trim().length > 100) {
        return 'El slug no puede superar los 100 caracteres';
    }
    const baseUrl = body.base_url?.trim() ?? '';
    if (baseUrl !== '' && (baseUrl.length > 255 || !isHttpUrl(baseUrl))) {
        return 'La URL base debe ser una URL http(s) de hasta 255 caracteres';
    }
    return null;
}

const toData = (body: IFormPlatform): Omit<IFormPlatform, 'platform_id'> => ({
    name: body.name.trim(),
    slug: body.slug.trim(),
    base_url: body.base_url?.trim() ? body.base_url.trim() : null,
    is_external: body.is_external ? 1 : 0,
    is_payment: body.is_payment ? 1 : 0,
    state: body.state ? 1 : 0,
})

const notFound = () => NextResponse.json({ success: false, message: 'La plataforma ya no existe' }, { status: 404 });

export async function POST(request: NextRequest) {
    logger.info(`api/platform POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormPlatform = await request.json();
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryPlatform.findBySlug(body.slug.trim());
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe una plataforma con ese slug' }, { status: 409 });
        }
        const platform = await repositoryPlatform.create(toData(body));
        const resp: IResponse<IAdminPlatform> = { data: platform, message: 'Plataforma creada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ success: false, message: 'Ya existe una plataforma con ese slug' }, { status: 409 });
        }
        logger.error(`api/platform POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    logger.info(`api/platform PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormPlatform = await request.json();
        if (body.platform_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta platform_id' }, { status: 400 });
        }
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryPlatform.findBySlug(body.slug.trim(), body.platform_id);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe una plataforma con ese slug' }, { status: 409 });
        }
        const platform = await repositoryPlatform.update(body.platform_id, toData(body));
        const resp: IResponse<IAdminPlatform> = { data: platform, message: 'Plataforma actualizada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return notFound();
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ success: false, message: 'Ya existe una plataforma con ese slug' }, { status: 409 });
        }
        logger.error(`api/platform PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    logger.info(`api/platform DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { platform_id: number } = await request.json();
        if (body.platform_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta platform_id' }, { status: 400 });
        }
        await repositoryPlatform.deletePlatform(body.platform_id);
        const resp: IResponse<null> = { data: null, message: 'Plataforma eliminada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede eliminar: hay packs con pósters en esta plataforma. Desactívala en su lugar.' }, { status: 409 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return notFound();
        }
        logger.error(`api/platform DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
