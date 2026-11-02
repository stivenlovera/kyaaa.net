import { NextRequest, NextResponse } from "next/server";
import { repositoryPlatform } from "@/src/app/repositories/platform.repository";
import logger, { jsonLog } from "@/src/app/utils/logger";

// Redirección pública de un póster (?id=pack_platform_id): cuenta el clic y manda a la plataforma.
// Si falla el contador o el póster ya no existe, vuelve a la portada en lugar de mostrar un error.
export async function GET(request: NextRequest) {
    const pack_platform_id = Number(request.nextUrl.searchParams.get('id'));
    try {
        if (Number.isInteger(pack_platform_id) && pack_platform_id > 0) {
            const url = await repositoryPlatform.registerClick(pack_platform_id);
            if (url !== null) {
                return NextResponse.redirect(url, 302);
            }
        }
    } catch (error: any) {
        logger.error(`api/pack/platform/go GET error=> ${jsonLog(error.message)}`)
    }
    return NextResponse.redirect(new URL('/', request.url), 302);
}
