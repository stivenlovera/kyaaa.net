import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryLabel } from "@/src/app/repositories/label.repository";
import { IAdminLabel, IFormLabel } from "@/src/app/types/label.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../generated/prisma/client";

const validate = (body: Partial<IFormLabel>): string | null => {
    if (!body.name || body.name.trim() === '') {
        return 'El nombre es obligatorio';
    }
    if (!body.slug || body.slug.trim() === '') {
        return 'El slug es obligatorio';
    }
    return null;
}

export async function POST(request: NextRequest) {
    logger.info(`api/label POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormLabel = await request.json();
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryLabel.findBySlug(body.slug);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe una etiqueta con ese slug' }, { status: 409 });
        }
        const label = await repositoryLabel.create(body.name.trim(), body.slug.trim(), body.state ? 1 : 0);
        const resp: IResponse<IAdminLabel> = { data: label, message: 'Etiqueta creada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/label POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    logger.info(`api/label PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormLabel = await request.json();
        if (body.label_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta label_id' }, { status: 400 });
        }
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryLabel.findBySlug(body.slug, body.label_id);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe una etiqueta con ese slug' }, { status: 409 });
        }
        const label = await repositoryLabel.update(body.label_id, body.name.trim(), body.slug.trim(), body.state ? 1 : 0);
        const resp: IResponse<IAdminLabel> = { data: label, message: 'Etiqueta actualizada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'La etiqueta ya no existe' }, { status: 404 });
        }
        logger.error(`api/label PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    logger.info(`api/label DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { label_id: number } = await request.json();
        if (body.label_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta label_id' }, { status: 400 });
        }
        await repositoryLabel.delete(body.label_id);
        const resp: IResponse<null> = { data: null, message: 'Etiqueta eliminada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede eliminar: hay packs que usan esta etiqueta' }, { status: 409 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'La etiqueta ya no existe' }, { status: 404 });
        }
        logger.error(`api/label DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
