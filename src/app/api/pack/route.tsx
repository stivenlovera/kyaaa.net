import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { IAdminPack, IFormPack } from "@/src/app/types/pack.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../generated/prisma/client";

const validate = (body: Partial<IFormPack>): string | null => {
    if (!body.name || body.name.trim() === '') {
        return 'El nombre es obligatorio';
    }
    if (!body.code || body.code.trim() === '') {
        return 'El código es obligatorio';
    }
    if (!body.description || body.description.trim() === '') {
        return 'La descripción es obligatoria';
    }
    if (body.price_list === undefined || isNaN(body.price_list) || body.price_list < 0) {
        return 'El precio no es válido';
    }
    if (body.state_pack_id === undefined) {
        return 'El estado del pack es obligatorio';
    }
    return null;
}

export async function POST(request: NextRequest) {
    logger.info(`api/pack POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormPack = await request.json();
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryPack.findByCode(body.code);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe un pack con ese código' }, { status: 409 });
        }
        const pack = await repositoryPack.create(body.name.trim(), body.code.trim(), body.description.trim(), body.price_list, body.state ? 1 : 0, body.state_pack_id);
        const resp: IResponse<IAdminPack> = { data: pack, message: 'Pack creado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'El estado del pack no es válido' }, { status: 400 });
        }
        logger.error(`api/pack POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    logger.info(`api/pack PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormPack = await request.json();
        if (body.pack_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta pack_id' }, { status: 400 });
        }
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryPack.findByCode(body.code, body.pack_id);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe un pack con ese código' }, { status: 409 });
        }
        const pack = await repositoryPack.update(body.pack_id, body.name.trim(), body.code.trim(), body.description.trim(), body.price_list, body.state ? 1 : 0, body.state_pack_id);
        const resp: IResponse<IAdminPack> = { data: pack, message: 'Pack actualizado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'El estado del pack no es válido' }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El pack ya no existe' }, { status: 404 });
        }
        logger.error(`api/pack PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    logger.info(`api/pack DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { pack_id: number } = await request.json();
        if (body.pack_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta pack_id' }, { status: 400 });
        }
        await repositoryPack.delete(body.pack_id);
        const resp: IResponse<null> = { data: null, message: 'Pack eliminado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede eliminar: el pack tiene páginas, compras u otros datos asociados' }, { status: 409 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El pack ya no existe' }, { status: 404 });
        }
        logger.error(`api/pack DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
