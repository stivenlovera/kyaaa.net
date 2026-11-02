// URLs de las imágenes de los packs. Solo para el servidor: usa las credenciales de S3.
//
// - Versión censurada (páginas gratis vistas por un anónimo, portadas): URL pública estable
//   (NEXT_PUBLIC_PACKS_URL_S3), cacheable. El bucket público solo tiene las páginas gratis, censuradas.
// - Resto: URL firmada del bucket privado (AWS_BUCKET_PACKS_PRIVATE), sin censura, que caduca.
//   Quien llama debe haber comprobado antes que el usuario puede ver la página
//   (ver repositoryPage.findPagesPack); esta función solo firma.
// - Si AWS_BUCKET_PACKS_PRIVATE no está definida, todo se sirve con la URL pública. Así el código se
//   puede desplegar antes de mover los archivos al bucket privado (scripts/move-paid-pages.mjs).
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ZipLevel } from './page-access';

// Un lector puede pasar horas en el visor sin recargar la página, por eso el margen es amplio.
export const SIGNED_URL_TTL_SECONDS = 6 * 60 * 60;

// La URL del ZIP solo sirve para iniciar la descarga en el momento: caduca pronto para que no se pueda compartir.
export const ZIP_URL_TTL_SECONDS = 10 * 60;

export interface IPackImageSource {
    code: string
    size: string
    num: string
    extension: string
    /** Servir la versión censurada del bucket público (solo existe para páginas gratis, page_type 1). */
    censored: boolean
}

let client: S3Client | undefined;

function getClient(): S3Client {
    client ??= new S3Client({
        region: process.env.AWS_REGION,
        forcePathStyle: true,
        endpoint: process.env.AWS_ENPOINT,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
    return client;
}

/** URL de una imagen de los modales del pack (pack.thanks_image / pack.register_image), en el bucket static. */
export function packMediaUrl(key: string | null): string | null {
    return key ? `${process.env.NEXT_PUBLIC_STATIC_URL_S3}/${key}` : null;
}

export async function packImageUrl({ code, size, num, extension, censored }: IPackImageSource): Promise<string> {
    const key = `${code}/${size}/${num}.${extension}`;
    const privateBucket = process.env.AWS_BUCKET_PACKS_PRIVATE;
    if (censored || !privateBucket) {
        return `${process.env.NEXT_PUBLIC_PACKS_URL_S3}/${key}`;
    }
    return getSignedUrl(
        getClient(),
        new GetObjectCommand({ Bucket: privateBucket, Key: key }),
        { expiresIn: SIGNED_URL_TTL_SECONDS },
    );
}

/**
 * URL firmada del ZIP pregenerado de un pack (`<code>/zip/<level>.zip` en el bucket privado, lo genera
 * markwater-kyaaa con USE_MODE=ZIP), o null si ese ZIP todavía no existe. Quien llama debe haber
 * comprobado antes el nivel al que tiene acceso el usuario (ver repositoryPage.findDownloadLevel).
 */
export async function packZipUrl(code: string, level: ZipLevel, fileName: string): Promise<string | null> {
    const privateBucket = process.env.AWS_BUCKET_PACKS_PRIVATE;
    if (!privateBucket) {
        return null;
    }
    const key = `${code}/zip/${level}.zip`;
    try {
        await getClient().send(new HeadObjectCommand({ Bucket: privateBucket, Key: key }));
    } catch (error: any) {
        if (error?.$metadata?.httpStatusCode === 404) {
            return null;
        }
        throw error;
    }
    return getSignedUrl(
        getClient(),
        new GetObjectCommand({
            Bucket: privateBucket,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${fileName}"`,
        }),
        { expiresIn: ZIP_URL_TTL_SECONDS },
    );
}
