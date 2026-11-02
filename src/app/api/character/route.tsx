import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryCharacter } from "@/src/app/repositories/character.repository";
import { IAdminCharacter, IFormCharacter } from "@/src/app/types/character.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../generated/prisma/client";

const validate = (body: Partial<IFormCharacter>): string | null => {
    if (!body.name || body.name.trim() === '') {
        return 'El nombre es obligatorio';
    }
    if (!body.slug || body.slug.trim() === '') {
        return 'El slug es obligatorio';
    }
    return null;
}

export async function POST(request: NextRequest) {
    logger.info(`api/character POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormCharacter = await request.json();
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryCharacter.findBySlug(body.slug);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe un personaje con ese slug' }, { status: 409 });
        }
        const character = await repositoryCharacter.create(body.name.trim(), body.slug.trim(), body.state ? 1 : 0);
        const resp: IResponse<IAdminCharacter> = { data: character, message: 'Personaje creado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/character POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    logger.info(`api/character PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormCharacter = await request.json();
        if (body.character_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta character_id' }, { status: 400 });
        }
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const duplicated = await repositoryCharacter.findBySlug(body.slug, body.character_id);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ya existe un personaje con ese slug' }, { status: 409 });
        }
        const character = await repositoryCharacter.update(body.character_id, body.name.trim(), body.slug.trim(), body.state ? 1 : 0);
        const resp: IResponse<IAdminCharacter> = { data: character, message: 'Personaje actualizado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El personaje ya no existe' }, { status: 404 });
        }
        logger.error(`api/character PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    logger.info(`api/character DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { character_id: number } = await request.json();
        if (body.character_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta character_id' }, { status: 400 });
        }
        await repositoryCharacter.delete(body.character_id);
        const resp: IResponse<null> = { data: null, message: 'Personaje eliminado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede eliminar: hay packs que usan este personaje' }, { status: 409 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El personaje ya no existe' }, { status: 404 });
        }
        logger.error(`api/character DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
