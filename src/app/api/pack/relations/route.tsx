import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { IFormPackRelations } from "@/src/app/types/pack.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../../generated/prisma/client";

export async function POST(request: NextRequest) {
    logger.info(`api/pack/relations POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormPackRelations = await request.json();
        if (body.pack_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta pack_id' }, { status: 400 });
        }
        await repositoryPack.setRelations(body.pack_id, {
            label_ids: body.label_ids ?? [],
            character_ids: body.character_ids ?? [],
            serie_ids: body.serie_ids ?? [],
            author_ids: body.author_ids ?? [],
            language_ids: body.language_ids ?? [],
        });
        const resp: IResponse<null> = { data: null, message: 'Relaciones actualizadas', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'El pack ya no existe' }, { status: 404 });
        }
        logger.error(`api/pack/relations POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
