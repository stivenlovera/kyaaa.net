import sharp from "sharp";

/**
 * Foto de perfil: 450px de ancho en AVIF. Todo en memoria: la imagen subida no se escribe en disco
 * (antes quedaba una copia del original en public/temp y otra en public/resize que nunca se borraban).
 */
export async function resizeProfileImage(input: Buffer): Promise<Buffer> {
    return sharp(input)
        .resize(450)
        .toFormat("avif")
        .toBuffer();
}
