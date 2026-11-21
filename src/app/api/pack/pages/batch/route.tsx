import { NextRequest, NextResponse } from "next/server";
import { adminDenied } from "@/src/app/utils/auth";
import { PageNotFoundError, repositoryPage } from "@/src/app/repositories/pages.repository";
import { IFormPage, IFormPagesBatch } from "@/src/app/types/page.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { PAGE_TYPE } from "@/src/app/utils/page-access";
import { Prisma } from "../../../../../../generated/prisma/client";

// Tope por petición: un pack tiene como mucho unos cientos de páginas.
const MAX_PAGES = 2000;
// Largo de page.num (varchar(5)).
const MAX_NUM_LENGTH = 5;

function validate(pages: IFormPage[]): string | null {
    if (pages.length === 0) {
        return 'No hay cambios que guardar';
    }
    if (pages.length > MAX_PAGES) {
        return `Se pueden guardar como mucho ${MAX_PAGES} páginas a la vez`;
    }
    for (const page of pages) {
        if (!Number.isInteger(page.page_id) || page.page_id <= 0) {
            return 'Falta page_id';
        }
        if (typeof page.num !== 'string' || page.num.trim() === '') {
            return 'El número de página es obligatorio';
        }
        if (page.num.trim().length > MAX_NUM_LENGTH) {
            return `El número de página "${page.num.trim()}" es demasiado largo (máximo ${MAX_NUM_LENGTH} caracteres)`;
        }
        if (!(Object.values(PAGE_TYPE) as number[]).includes(page.page_type_id)) {
            return `Tipo de página inválido en la página ${page.num.trim()}`;
        }
    }
    if (new Set(pages.map(({ page_id }) => page_id)).size !== pages.length) {
        return 'Una página aparece dos veces';
    }
    const nums = pages.map(({ num }) => num.trim());
    const repeated = nums.find((num, index) => nums.indexOf(num) !== index);
    if (repeated !== undefined) {
        return `El número ${repeated} está repetido`;
    }
    return null;
}

// Guarda de una vez todas las páginas editadas en /admin/pack/edit (pack-pages-manager.tsx). Todo o nada.
export async function PATCH(request: NextRequest) {
    logger.info(`api/pack/pages/batch PATCH`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormPagesBatch = await request.json();
        const pages = Array.isArray(body.pages) ? body.pages : [];
        const error = validate(pages);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const count = await repositoryPage.updateMany(pages.map((page) => ({
            page_id: page.page_id,
            num: page.num.trim(),
            page_type_id: page.page_type_id,
            state: page.state ? 1 : 0,
        })));
        logger.info(`api/pack/pages/batch PATCH ${count} páginas guardadas`)
        const resp: IResponse<{ count: number }> = { data: { count }, message: 'Páginas actualizadas', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof PageNotFoundError) {
            return NextResponse.json({ success: false, message: error.message }, { status: 404 });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ success: false, message: 'Uno de los números ya lo usa otra página de este pack' }, { status: 409 });
        }
        logger.error(`api/pack/pages/batch PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
