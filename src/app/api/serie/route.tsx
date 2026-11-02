import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositorySerie } from "@/src/app/repositories/serie.repository";
import { IAdminSerie, IFormSerie } from "@/src/app/types/serie.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../generated/prisma/client";

const validate = (body: Partial<IFormSerie>): string | null => {
    if (!body.name || body.name.trim() === '') {
        return 'El nombre es obligatorio';
    }
    if (!body.slug || body.slug.trim() === '') {
        return 'El slug es obligatorio';
    }
    return null;
}

export async function POST(request: NextRequest) {
    logger.info(`api/serie POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormSerie = await request.json();
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositorySerie.findBySlug(body.slug);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe una serie con ese slug' }, { status: 409 });
        }
        const serie = await repositorySerie.create(body.name.trim(), body.slug.trim(), body.state ? 1 : 0);
        const resp: IResponse<IAdminSerie> = { data: serie, message: 'Serie creada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/serie POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    logger.info(`api/serie PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormSerie = await request.json();
        if (body.serie_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta serie_id' }, { status: 400 });
        }
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositorySerie.findBySlug(body.slug, body.serie_id);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe una serie con ese slug' }, { status: 409 });
        }
        const serie = await repositorySerie.update(body.serie_id, body.name.trim(), body.slug.trim(), body.state ? 1 : 0);
        const resp: IResponse<IAdminSerie> = { data: serie, message: 'Serie actualizada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'La serie ya no existe' }, { status: 404 });
        }
        logger.error(`api/serie PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    logger.info(`api/serie DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { serie_id: number } = await request.json();
        if (body.serie_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta serie_id' }, { status: 400 });
        }
        await repositorySerie.delete(body.serie_id);
        const resp: IResponse<null> = { data: null, message: 'Serie eliminada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede eliminar: hay packs que usan esta serie' }, { status: 409 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'La serie ya no existe' }, { status: 404 });
        }
        logger.error(`api/serie DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
