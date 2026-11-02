import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryAuthor } from "@/src/app/repositories/author.repository";
import { IAdminAuthor, IFormAuthor } from "@/src/app/types/author.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../generated/prisma/client";

const validate = (body: Partial<IFormAuthor>): string | null => {
    if (!body.name || body.name.trim() === '') {
        return 'El nombre es obligatorio';
    }
    if (!body.slug || body.slug.trim() === '') {
        return 'El slug es obligatorio';
    }
    return null;
}

export async function POST(request: NextRequest) {
    logger.info(`api/author POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormAuthor = await request.json();
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryAuthor.findBySlug(body.slug);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe un autor con ese slug' }, { status: 409 });
        }
        const author = await repositoryAuthor.create(body.name.trim(), body.slug.trim(), body.state ? 1 : 0);
        const resp: IResponse<IAdminAuthor> = { data: author, message: 'Autor creado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/author POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    logger.info(`api/author PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormAuthor = await request.json();
        if (body.author_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta author_id' }, { status: 400 });
        }
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryAuthor.findBySlug(body.slug, body.author_id);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe un autor con ese slug' }, { status: 409 });
        }
        const author = await repositoryAuthor.update(body.author_id, body.name.trim(), body.slug.trim(), body.state ? 1 : 0);
        const resp: IResponse<IAdminAuthor> = { data: author, message: 'Autor actualizado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El autor ya no existe' }, { status: 404 });
        }
        logger.error(`api/author PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    logger.info(`api/author DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { author_id: number } = await request.json();
        if (body.author_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta author_id' }, { status: 400 });
        }
        await repositoryAuthor.delete(body.author_id);
        const resp: IResponse<null> = { data: null, message: 'Autor eliminado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede eliminar: hay packs que usan este autor' }, { status: 409 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El autor ya no existe' }, { status: 404 });
        }
        logger.error(`api/author DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
