import { ICountTag } from "../[locale]/pack/_components/card-section";
import { IPage } from "./page.types";

export interface IListPacks {
    name: string;
    code: string;
    pack_id: number;
    description: string;
    portada: {
        num: string,
        extension: string
        name: string
        /** URL de la portada: pública, o firmada si la portada es una página de pago. */
        url: string
    }
    pack_serie: PackSerie[]
    pack_character: PackCharacter[]
}

export interface INewPacksAuth extends IListPacks {
    buy: boolean
    like: boolean
    favorite: boolean
}


export interface IPackInfo {
    name: string
    description: string
    pack_id: number
    code: string
    price_list: number
    update_at: Date | null
    portada: {
        num: string,
        extension: string
        name: string
        /** URL de la portada: pública, o firmada si la portada es una página de pago. */
        url: string
    }
    /** URL de la imagen del modal "Gracias por tu compra"; null = imagen por defecto. */
    thanks_image: string | null
    /** URL de la imagen del modal "Registrate ahora!"; null = sin imagen. */
    register_image: string | null
    pack_serie: PackSerie[]
    pack_types: PackType[]
    pack_character: PackCharacter[]
    pack_label: PackLabel[]
    pack_authors: PackAuthor[]
    pack_languages: PackLanguage[]
}

export interface IPackInfoPage extends IPackInfo {
    total_characters: ICountTag[] | null
    total_series: ICountTag[] | null
    total_labels: ICountTag[] | null
    total_authors: ICountTag[] | null
    pages: IPage[]
    buy: boolean
    like: boolean
    favorite: boolean
}

export interface Page {
    num: string
    page_size: PageSize[]
}

export interface PageSize {
    size: Size
}

export interface Size {
    extension: string
    name: string
}

export interface PackSerie {
    serie: Serie
}

export interface Serie {
    name: string
    serie_id: number
}

export interface PackType {
    type: Type
}

export interface Type {
    name: string
    type_id: number
}

export interface PackCharacter {
    character: Character
}

export interface Character {
    name: string
    character_id: number
}

export interface PackLabel {
    label: Label
}

export interface Label {
    name: string
    label_id: number
}

export interface PackAuthor {
    author: Author
}

export interface Author {
    name: string
    author_id: number
}

export interface PackLanguage {
    language: Language
}

export interface Language {
    name: string
    language_id: number
}

export interface IAdminPack {
    pack_id: number;
    name: string;
    code: string;
    description: string;
    price_list: number;
    state: number;
    state_pack_id: number;
    update_at: Date | null;
    /** URL completa de la imagen del modal "Gracias por tu compra"; null = la genérica. */
    thanks_image: string | null;
    /** URL completa de la imagen del modal "Registrate ahora!"; null = sin imagen. */
    register_image: string | null;
    pack_serie: PackSerie[];
    pack_character: PackCharacter[];
    /** URL de la miniatura de la primera página; null si el pack aún no tiene páginas. */
    thumbnail: string | null;
}

/** Columnas de `pack` con imágenes de los modales, subidas al bucket static en `packs/<code>/<campo>.<ext>`. */
export const PACK_MEDIA_FIELDS = ['thanks_image', 'register_image'] as const;
export type PackMediaField = typeof PACK_MEDIA_FIELDS[number];

export interface IAdminPackPage {
    packs: IAdminPack[];
    total: number;
}

export interface IFormPack {
    pack_id?: number;
    name: string;
    code: string;
    description: string;
    price_list: number;
    state: number;
    state_pack_id: number;
}

/** Datos mínimos del pack para la pantalla de edición de relaciones y páginas (sin portada ni páginas). */
export interface IPackForEdit {
    pack_id: number;
    name: string;
    code: string;
    state_pack_id: number;
    pack_label: PackLabel[];
    pack_character: PackCharacter[];
    pack_serie: PackSerie[];
    pack_authors: PackAuthor[];
    pack_languages: PackLanguage[];
}

export interface IPackRelationIds {
    label_ids: number[];
    character_ids: number[];
    serie_ids: number[];
    author_ids: number[];
    language_ids: number[];
}

export interface IFormPackRelations extends IPackRelationIds {
    pack_id: number;
}