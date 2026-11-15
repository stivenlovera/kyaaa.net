import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryParticipate } from "@/src/app/repositories/participate.repository";
import { IResponse } from "@/src/app/types/response";
import { STATE_PACK_PARTICIPATE } from "@/src/app/utils/page-access";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../../generated/prisma/client";

// Inscribe un pack en una participación (fila de participate_pack).
export async function POST(request: NextRequest) {
    logger.info(`api/participate/pack POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { participate_id?: number, pack_id?: number } = await request.json();
        if (!Number.isInteger(body.participate_id) || !Number.isInteger(body.pack_id) || body.pack_id! <= 0) {
            return NextResponse.json({ success: false, message: 'Elige un pack' }, { status: 400 });
        }
        // Solo se votan los packs en borrador (es lo único que muestra /participate).
        const packState = await repositoryParticipate.findPackState(body.pack_id!);
        if (packState === null) {
            return NextResponse.json({ success: false, message: 'El pack no existe' }, { status: 404 });
        }
        if (packState !== STATE_PACK_PARTICIPATE) {
            return NextResponse.json({ success: false, message: 'Solo se pueden agregar packs en estado «borrador»' }, { status: 400 });
        }
        const duplicated = await repositoryParticipate.findParticipatePack(body.participate_id!, body.pack_id!);
        if (duplicated !== null) {
            return NextResponse.json({ success: false, message: 'Ese pack ya está en la participación' }, { status: 409 });
        }
        await repositoryParticipate.addPack(body.participate_id!, body.pack_id!);
        const resp: IResponse<boolean> = { data: true, message: 'Pack agregado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'La participación o el pack ya no existen' }, { status: 404 });
        }
        logger.error(`api/participate/pack POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

// Quita un pack de la participación. Solo si nadie lo ha votado todavía.
export async function DELETE(request: NextRequest) {
    logger.info(`api/participate/pack DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { participate_pack_id?: number } = await request.json();
        if (!Number.isInteger(body.participate_pack_id)) {
            return NextResponse.json({ success: false, message: 'Falta participate_pack_id' }, { status: 400 });
        }
        const votes = await repositoryParticipate.countPackVotes(body.participate_pack_id!);
        if (votes > 0) {
            return NextResponse.json({ success: false, message: `No se puede quitar: el pack tiene ${votes} voto(s)` }, { status: 409 });
        }
        await repositoryParticipate.removePack(body.participate_pack_id!);
        const resp: IResponse<boolean> = { data: true, message: 'Pack quitado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El pack ya no está en la participación' }, { status: 404 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede quitar: el pack tiene votos' }, { status: 409 });
        }
        logger.error(`api/participate/pack DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
