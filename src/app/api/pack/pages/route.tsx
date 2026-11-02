import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { repositoryPage } from "@/src/app/repositories/pages.repository";
import { IFormPage } from "@/src/app/types/page.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { PAGE_TYPE } from "@/src/app/utils/page-access";
import { Prisma } from "../../../../../generated/prisma/client";

export async function PATCH(request: NextRequest) {
    logger.info(`api/pack/pages PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormPage = await request.json();
        if (body.page_id === undefined) {
            return NextResponse.json({ success: false, message: 'Falta page_id' }, { status: 400 });
        }
        if (!body.num || body.num.trim() === '') {
            return NextResponse.json({ success: false, message: 'El número de página es obligatorio' }, { status: 400 });
        }
        if (!(Object.values(PAGE_TYPE) as number[]).includes(body.page_type_id)) {
            return NextResponse.json({ success: false, message: 'Tipo de página inválido' }, { status: 400 });
        }
        const page = await repositoryPage.update(body.page_id, body.num.trim(), body.page_type_id, body.state ? 1 : 0);
        const resp: IResponse<{ page_id: number }> = { data: page, message: 'Página actualizada', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ success: false, message: 'Ya existe una página con ese número en este pack' }, { status: 409 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ success: false, message: 'La página ya no existe' }, { status: 404 });
        }
        logger.error(`api/pack/pages PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}

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
