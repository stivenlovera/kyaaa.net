export interface IPlatform {
    platform_id: number
    name: string
    slug: string
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
