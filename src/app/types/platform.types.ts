export interface IPlatform {
    platform_id: number
    name: string
    slug: string
    /** 1 = plataforma de un tercero (Ko-fi, Patreon…); 0 = propia. */
    is_external: number
    /** 1 = tiene pasarela de pago ("Compra también por"); 0 = red social ("Síguenos en"). */
    is_payment: number
}

/** Póster de un pack en una plataforma, tal como se muestra debajo del botón comprar. */
export interface IPackPlatform {
    pack_platform_id: number
    platform: IPlatform
    /** URL completa del póster en el bucket static. */
    poster: string
    title: string | null
}

/** Versión del admin: incluye el destino, el orden, el contador y el estado. */
export interface IAdminPackPlatform extends IPackPlatform {
    url: string
    sort: number
    clicks: number
    state: number
}

/** Fila del catálogo de plataformas en /admin/platform. */
export interface IAdminPlatform {
    platform_id: number
    name: string
    slug: string
    base_url: string | null
    is_external: number
    is_payment: number
    state: number
    update_at: Date | null
}

export interface IAdminPlatformPage {
    platforms: IAdminPlatform[]
    total: number
}

export interface IFormPlatform {
    platform_id?: number
    name: string
    slug: string
    base_url: string | null
    is_external: number
    is_payment: number
    state: number
}

/** Filtro de la grilla de /admin/pack-platform. */
export type PosterFilter = 'all' | 'with' | 'without'

/** Fila de /admin/pack-platform: un pack con el resumen de sus pósters. */
export interface IAdminPackPosters {
    pack_id: number
    name: string
    code: string
    /** Pósters completos del pack, para el modal "Gestionar". */
    items: IAdminPackPlatform[]
    active: number
    clicks: number
}

export interface IAdminPackPostersPage {
    packs: IAdminPackPosters[]
    total: number
}
