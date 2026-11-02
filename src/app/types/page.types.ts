export interface IPagePack {
    name: string,
    description: string,
    pack_id: number,
    code: string,
    pages: IPage[]
    /** Total de páginas del pack, incluidas las bloqueadas para este usuario. */
    total: number
    /** Páginas que este usuario ve sin comprar (gratis, más las de registrados si está logueado; todas si el pack es gratuito). */
    free: number
    /** El pack es gratuito (pack_type gratis). */
    is_free: boolean
    /** true si el usuario ve todo el pack (pack gratuito o comprado). */
    full_access: boolean
}

export interface IPage {
    num: string
    page_size: IPageSize[]
    /** URL de la imagen: pública y censurada si es gratis y el usuario es anónimo; firmada (caduca) y sin censura en otro caso. */
    url: string
}

export interface IPageSize {
    size: ISize
}

export interface ISize {
    name: string
    extension: string
}

export interface Size {
    name: "tumb" | "medium" | "web" | "premium-web" | "meta"
}

/** Página de un pack para la gestión de admin: sin filtrar por acceso del usuario. */
export interface IAdminPage {
    page_id: number
    num: string
    /** 1 = gratis, 2 = de pago, 3 = registrados (ver PAGE_TYPE en utils/page-access.ts). */
    page_type_id: number
    state: number
    /** Miniatura (size "tumb"); cadena vacía si no se generó todavía. */
    url: string
}

export interface IFormPage {
    page_id: number
    num: string
    page_type_id: number
    state: number
}