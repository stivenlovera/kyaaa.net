// Ids de las tablas `page_type` y `type` (ver data-base/population.sql, sección #POBLACION).
// FREE: muestra para todos (censurada para anónimos). REGISTERED: muestra para usuarios logueados.
// BUY: solo para quien compra el pack.
export const PAGE_TYPE = {
    FREE: 1,
    BUY: 2,
    REGISTERED: 3,
} as const;

/** Tipos de página visibles sin haber comprado el pack: anónimos solo FREE; logueados, FREE y REGISTERED. */
export function pageTypesWithoutPurchase(loggedIn: boolean): number[] {
    return loggedIn ? [PAGE_TYPE.FREE, PAGE_TYPE.REGISTERED] : [PAGE_TYPE.FREE];
}

export const PACK_TYPE = {
    PAID: 1,
    FREE: 2,
} as const;

// Ids de la tabla `rol` (ver data-base/migrations/2026-10-31_rol_admin.sql).
export const ROL = {
    ADMIN: 1,
} as const;

// Ids de la tabla `state_pack` (ver data-base/population.sql).
export const STATE_PACK = {
    PUBLISHED: 1,
    COMING_SOON: 2,
    DRAFT: 3,
} as const;

// Ids de la tabla `size` que usa la web (ver data-base/population.sql). OG: imagen para redes sociales.
export const SIZE = {
    TUMB: 1,
    MEDIUM: 2,
    WEB: 3,
    OG: 6,
} as const;

// Niveles de descarga: ZIP pregenerados por markwater-kyaaa (USE_MODE=ZIP) en el bucket privado con la
// key `<pack.code>/zip/<nivel>.zip`. REGISTERED: páginas gratis y de registrados; FULL: todas.
// Los nombres deben coincidir con markwater-kyaaa (src/executions/zip-pack.ts).
export const ZIP_LEVEL = {
    REGISTERED: 'registered',
    FULL: 'full',
} as const;

export type ZipLevel = typeof ZIP_LEVEL[keyof typeof ZIP_LEVEL];
