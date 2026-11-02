import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/utils/auth";
import { repositoryPage } from "@/src/app/repositories/pages.repository";
import { packZipUrl } from "@/src/app/utils/pack-images";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";

// Devuelve una URL firmada y de corta duración al ZIP del pack que le corresponde al usuario;
// el navegador descarga directamente de S3, sin pasar el archivo por este servidor.
export async function GET(request: NextRequest) {
    logger.info(`api/pack/download GET`)
    try {
        const user = await getCurrentUser();
        if (user === null) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const code = request.nextUrl.searchParams.get('code');
        if (!code) {
            return NextResponse.json({ success: false, message: 'Falta code' }, { status: 400 });
        }
        const download = await repositoryPage.findDownloadLevel(code, user.user_id);
        if (download === null) {
            return NextResponse.json({ success: false, message: 'El pack no existe' }, { status: 404 });
        }
        const url = await packZipUrl(download.code, download.level, `${download.code}.zip`);
        if (url === null) {
            logger.warn(`api/pack/download GET zip no disponible ${jsonLog(download)}`)
            return NextResponse.json({ success: false, message: 'La descarga aún no está disponible' }, { status: 404 });
        }
        logger.info(`api/pack/download GET ${jsonLog({ user_id: user.user_id, ...download })}`)
        const resp: IResponse<{ url: string }> = { data: { url }, message: 'OK', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/pack/download GET error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: error.message || 'Error del servidor' }, { status: 500 });
    }
}
