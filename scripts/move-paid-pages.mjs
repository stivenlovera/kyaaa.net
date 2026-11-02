// Mueve al bucket privado los archivos de las páginas de pago (page_type 2) y de registrados (page_type 3)
// de todos los packs. Las gratis (page_type 1) no se mueven: su versión sin censura se sube aparte con
// markwater-kyaaa (AWS_BUCKET_TARGET=PRIVATE).
//
//   node scripts/move-paid-pages.mjs                          simulación: solo cuenta y muestra ejemplos
//   node scripts/move-paid-pages.mjs --apply                  copia al bucket privado y verifica cada archivo
//   node scripts/move-paid-pages.mjs --apply --delete-source  además borra del bucket público lo ya verificado
//
// Opciones: --source-bucket <nombre> (por defecto AWS_BUCKET_PACKS) y --private-bucket <nombre>
// (por defecto AWS_BUCKET_PACKS_PRIVATE). Las claves son iguales en ambos buckets: {code}/{size}/{num}.{ext}.
//
// Orden recomendado: 1) crear el bucket privado, 2) desplegar el código (sigue sirviendo por URL pública
// mientras AWS_BUCKET_PACKS_PRIVATE no exista), 3) --apply, 4) definir AWS_BUCKET_PACKS_PRIVATE y redesplegar,
// 5) comprobar que las páginas de pago cargan, 6) --apply --delete-source.
// Es reanudable: lo que ya está en el destino con el mismo tamaño se salta.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client,
} from '@aws-sdk/client-s3';
import mysql from 'mysql2/promise';

const PAGE_TYPES_PRIVATE = [2, 3]; // buy, registered
const CONCURRENCY = 8;
const CONTENT_TYPES = { avif: 'image/avif', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(path.join(root, '.env')); } catch { /* se usan las variables del entorno */ }

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

const apply = flag('--apply');
const deleteSource = flag('--delete-source');
const sourceBucket = option('--source-bucket') ?? process.env.AWS_BUCKET_PACKS;
const privateBucket = option('--private-bucket') ?? process.env.AWS_BUCKET_PACKS_PRIVATE;

if (deleteSource && !apply) fail('--delete-source requiere --apply.');
if (!sourceBucket) fail('Falta el bucket de origen: define AWS_BUCKET_PACKS o usa --source-bucket.');
if (!privateBucket) fail('Falta el bucket privado: define AWS_BUCKET_PACKS_PRIVATE o usa --private-bucket.');
if (sourceBucket === privateBucket) fail('El bucket de origen y el privado no pueden ser el mismo.');

function fail(message) {
    console.error(`Error: ${message}`);
    process.exit(1);
}

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    forcePathStyle: true,
    endpoint: process.env.AWS_ENPOINT,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
});

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
});
const [rows] = await db.query(
    `SELECT p.code, s.name AS size, s.extension, pg.num
       FROM page pg
       JOIN pack p ON p.pack_id = pg.pack_id
       JOIN page_size ps ON ps.page_id = pg.page_id
       JOIN size s ON s.size_id = ps.size_id
      WHERE pg.page_type_id IN (?)
      ORDER BY p.code, pg.num, s.size_id`,
    [PAGE_TYPES_PRIVATE],
);
await db.end();

const objects = rows.map((r) => ({ key: `${r.code}/${r.size}/${r.num}.${r.extension}`, extension: r.extension }));
console.log(`${apply ? 'APLICAR' : 'SIMULACIÓN'}: ${objects.length} archivos de páginas de pago y de registrados`);
console.log(`  origen:  ${sourceBucket}\n  destino: ${privateBucket}${deleteSource ? '\n  se borrarán del origen los ya verificados' : ''}`);

if (!apply) {
    const porPack = Object.entries(Object.groupBy(objects, (o) => o.key.split('/')[0]));
    for (const [code, list] of porPack) console.log(`  pack ${code}: ${list.length} archivos (ej. ${list[0].key})`);
    console.log('\nNo se ha cambiado nada. Ejecuta con --apply para copiar.');
    process.exit(0);
}

async function head(bucket, key) {
    try {
        return await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
        if (error.$metadata?.httpStatusCode === 404 || error.name === 'NotFound') return null;
        throw error;
    }
}

async function copy({ key, extension }) {
    const contentType = CONTENT_TYPES[extension];
    try {
        await s3.send(new CopyObjectCommand({
            Bucket: privateBucket,
            Key: key,
            CopySource: `${sourceBucket}/${encodeURIComponent(key).replaceAll('%2F', '/')}`,
            ...(contentType && { ContentType: contentType, MetadataDirective: 'REPLACE' }),
        }));
    } catch {
        // Si el proveedor no soporta la copia entre buckets, se descarga y se vuelve a subir.
        const object = await s3.send(new GetObjectCommand({ Bucket: sourceBucket, Key: key }));
        await s3.send(new PutObjectCommand({
            Bucket: privateBucket,
            Key: key,
            Body: Buffer.from(await object.Body.transformToByteArray()),
            ContentType: contentType ?? object.ContentType,
        }));
    }
}

const stats = { copiados: 0, ya_estaban: 0, borrados: 0, errores: 0 };

async function moveOne(object) {
    const { key } = object;
    try {
        const source = await head(sourceBucket, key);
        const target = await head(privateBucket, key);
        if (source === null && target === null) throw new Error('no existe en ningún bucket');
        if (source !== null && target?.ContentLength !== source.ContentLength) {
            await copy(object);
            const check = await head(privateBucket, key);
            if (check?.ContentLength !== source.ContentLength) throw new Error('la copia no coincide en tamaño');
            stats.copiados++;
        } else {
            stats.ya_estaban++;
        }
        // Solo se borra el origen si el destino existe y coincide (comprobado arriba).
        if (deleteSource && source !== null) {
            await s3.send(new DeleteObjectCommand({ Bucket: sourceBucket, Key: key }));
            stats.borrados++;
        }
    } catch (error) {
        stats.errores++;
        console.error(`  ERROR ${key}: ${error.message}`);
    }
}

let next = 0;
let done = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < objects.length) {
        await moveOne(objects[next++]);
        if (++done % 100 === 0) console.log(`  ${done}/${objects.length}`);
    }
}));

console.log(`\nListo: ${JSON.stringify(stats)}`);
if (stats.errores > 0) {
    console.error('Hubo errores: revisa el log y vuelve a ejecutar (es reanudable).');
    process.exit(1);
}
