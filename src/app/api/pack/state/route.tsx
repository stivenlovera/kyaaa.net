import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../../generated/prisma/client";

export async function PATCH(request: NextRequest) {
    logger.info(`api/pack/state PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { pack_id: number, state_pack_id: number } = await request.json();
        if (body.pack_id === undefined || body.state_pack_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta pack_id o state_pack_id' }, { status: 400 });
        }
        const pack = await repositoryPack.updateStatePack(body.pack_id, body.state_pack_id);
        const resp: IResponse<{ pack_id: number, state_pack_id: number }> = { data: pack, message: 'Estado del pack actualizado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'El estado del pack no es válido' }, { status: 400 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El pack ya no existe' }, { status: 404 });
        }
        logger.error(`api/pack/state PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
