// Cliente S3 único del servidor. El proveedor (Contabo, Cloudflare R2, Backblaze B2…) sale solo del entorno:
// AWS_ENPOINT (sic), AWS_REGION (`auto` en R2), AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.
import * as https from 'https';
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';

let client: S3Client | undefined;

export function getS3Client(): S3Client {
    client ??= new S3Client({
        requestHandler: new NodeHttpHandler({
            httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 1000 }),
        }),
        region: process.env.AWS_REGION,
        forcePathStyle: true,
        endpoint: process.env.AWS_ENPOINT,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        // Desde la v3.729 el SDK añade checksums CRC32 por defecto; no todos los proveedores compatibles
        // con S3 los aceptan. Solo se envían cuando la operación los exige.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
    });
    return client;
}
