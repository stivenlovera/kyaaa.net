import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client } from './s3-client';
import logger, { jsonLog } from './logger';
import sharp from 'sharp';
import { profileImageKey } from './profile-image';

export interface IFile {
    name: string
    buffer?: Buffer
    path: string
}

export async function uploadMultipleObjects(file: IFile) {
    try {
        const s3ClientImages = getS3Client();

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_STATIC,
            Key: profileImageKey(file.name), // The destination object key (file name)
            Body: file.buffer, // The file content
        });
        const result = await s3ClientImages.send(command);
        logger.info(`Imagen insertada: ${jsonLog({
            httpStatusCode: result.$metadata.httpStatusCode,
            name: file.name,
            path: file.path
        })}`)
    } catch (err) {
        logger.error(`Error uploading objects: ${jsonLog(err)}`);
        throw err;
    }
}

export async function deleteMultipleObjects(file: IFile) {
    logger.info(`deleteMultipleObjects ${jsonLog(file)}`)
    try {
        const s3ClientImages = getS3Client();

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_STATIC,
            Key: profileImageKey(file.name), // The destination object key (file name)
        });
        const result = await s3ClientImages.send(command);
        logger.info(`Imagen delete: ${jsonLog({
            httpStatusCode: result.$metadata.httpStatusCode,
            name: file.name,
            path: file.path
        })}`)
    } catch (err) {
        logger.error(`Error delete objects: ${jsonLog(err)}`);
        throw err;
    }
}

export async function getBufferFile(path: string) {
    const bufferMarkwater = await sharp(path)
        .toBuffer();
    return bufferMarkwater;
}
// Sube un archivo al bucket static con la key exacta (sin el prefijo `user/` de las fotos de perfil).
export async function uploadStaticObject(key: string, buffer: Buffer, contentType: string) {
    const s3Client = getS3Client();
    const result = await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_STATIC,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'max-age=43200',
    }));
    logger.info(`Imagen insertada: ${jsonLog({ httpStatusCode: result.$metadata.httpStatusCode, key })}`)
}

// Borra un objeto del bucket static. `key` puede traer el ?v= de caché que se guarda en BD; se ignora.
export async function deleteStaticObject(key: string) {
    const s3Client = getS3Client();
    const cleanKey = key.split('?')[0];
    const result = await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_STATIC,
        Key: cleanKey,
    }));
    logger.info(`Imagen eliminada: ${jsonLog({ httpStatusCode: result.$metadata.httpStatusCode, key: cleanKey })}`)
}
