import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryParticipate } from "@/src/app/repositories/participate.repository";
import { IAdminParticipate, IFormParticipate } from "@/src/app/types/participate.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../generated/prisma/client";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (value: unknown): value is string =>
    typeof value === 'string' && DATE_REGEX.test(value) && !isNaN(new Date(`${value}T00:00:00Z`).getTime());

const validate = (body: Partial<IFormParticipate>): string | null => {
    if (!body.name || body.name.trim() === '') {
        return 'El nombre es obligatorio';
    }
    if (!isValidDate(body.start_date)) {
        return 'La fecha de inicio no es válida';
    }
    if (!isValidDate(body.start_end)) {
        return 'La fecha de fin no es válida';
    }
    // Formato YYYY-MM-DD: la comparación de strings equivale a la de fechas.
    if (body.start_end < body.start_date) {
        return 'La fecha de fin no puede ser anterior a la de inicio';
    }
    if (!Number.isInteger(body.state_participate_id) || body.state_participate_id! <= 0) {
        return 'Elige un estado';
    }
    return null;
}

const notFound = () => NextResponse.json({ success: false, message: 'La participación ya no existe' }, { status: 404 });

export async function POST(request: NextRequest) {
    logger.info(`api/participate POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormParticipate = await request.json();
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const { participate_id } = await repositoryParticipate.create(body.name.trim(), body.start_date, body.start_end, body.state_participate_id);
        const participate = await repositoryParticipate.findById(participate_id);
        const resp: IResponse<IAdminParticipate | null> = { data: participate, message: 'Participación creada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'El estado elegido no existe' }, { status: 400 });
        }
        logger.error(`api/participate POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    logger.info(`api/participate PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormParticipate = await request.json();
        if (body.participate_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta participate_id' }, { status: 400 });
        }
        const error = validate(body);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        await repositoryParticipate.update(body.participate_id, body.name.trim(), body.start_date, body.start_end, body.state_participate_id);
        const participate = await repositoryParticipate.findById(body.participate_id);
        const resp: IResponse<IAdminParticipate | null> = { data: participate, message: 'Participación actualizada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return notFound();
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'El estado elegido no existe' }, { status: 400 });
        }
        logger.error(`api/participate PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    logger.info(`api/participate DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { participate_id: number } = await request.json();
        if (body.participate_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta participate_id' }, { status: 400 });
        }
        // Los votos son de los usuarios: no se borran en cascada.
        const votes = await repositoryParticipate.countVotes(body.participate_id);
        if (votes > 0) {
            return NextResponse.json({ success: false, message: `No se puede eliminar: la participación tiene ${votes} voto(s)` }, { status: 409 });
        }
        await repositoryParticipate.delete(body.participate_id);
        const resp: IResponse<null> = { data: null, message: 'Participación eliminada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return notFound();
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede eliminar: la participación tiene votos' }, { status: 409 });
        }
        logger.error(`api/participate DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
