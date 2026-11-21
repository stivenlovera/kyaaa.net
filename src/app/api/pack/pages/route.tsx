import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryPage } from "@/src/app/repositories/pages.repository";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../../generated/prisma/client";

// La edición de páginas se guarda en bloque: PATCH /api/pack/pages/batch.
export async function DELETE(request: NextRequest) {
    logger.info(`api/pack/pages DELETE`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: { page_id: number } = await request.json();
        if (body.page_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta page_id' }, { status: 400 });
        }
        await repositoryPage.delete(body.page_id);
        const resp: IResponse<null> = { data: null, message: 'Página eliminada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'La página ya no existe' }, { status: 404 });
        }
        logger.error(`api/pack/pages DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
