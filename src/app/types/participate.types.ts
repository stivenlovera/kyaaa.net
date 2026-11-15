import { IListPacks } from "./pack.types";

export interface IStateParticipate {
    state_participate_id: number;
    name: string;
}

/** Fila de la grilla de /admin/votes. Las fechas van como 'YYYY-MM-DD' (columnas `date`, sin hora ni zona). */
export interface IAdminParticipate {
    participate_id: number;
    name: string;
    start_date: string;
    start_end: string;
    state_participate_id: number;
    state_name: string;
    total_packs: number;
    total_votes: number;
    update_at: Date | null;
}

export interface IAdminParticipatePage {
    participates: IAdminParticipate[];
    total: number;
}

export interface IFormParticipate {
    participate_id?: number;
    name: string;
    start_date: string;
    start_end: string;
    state_participate_id: number;
}

/** Pack inscrito en una participación (fila de participate_pack) con sus votos. */
export interface IAdminParticipatePack {
    participate_pack_id: number;
    pack_id: number;
    name: string;
    code: string;
    state_pack_id: number | null;
    state_pack_name: string | null;
    votes: number;
    create_at: Date | null;
}

/**
 * Pack de una votación en /participate (está en "borrador", aún no publicado): sin flags de me gusta o
 * favorito; con sus votos y los pósters del carrusel.
 */
export interface IParticipatePackCard extends IListPacks {
    participate_pack_id: number;
    votes: number;
    /** URLs completas de los pósters activos, en orden. */
    posters: string[];
}

/** Participación visible en /participate (en curso o finalizada) con sus packs. */
export interface IPublicParticipate {
    participate_id: number;
    name: string;
    start_date: string;
    start_end: string;
    state_participate_id: number;
    packs: IParticipatePackCard[];
    /** participate_pack_id que votó el usuario en esta votación; null si no votó o no hay sesión. */
    voted: number | null;
}

/** Quién está viendo /participate, para decidir si puede votar. */
export type VoterStatus = 'anonymous' | 'unverified' | 'verified'

/** Respuesta de POST /api/participate/vote. */
export interface IVoteResult {
    /** participate_pack_id votado ahora; null si el usuario quitó su voto. */
    voted: number | null;
    /** Votos de cada pack de la votación: participate_pack_id → votos. */
    votes: Record<number, number>;
}

/** Datos de una votación en /participate. Fechas 'YYYY-MM-DD'. */
export interface IPublicParticipateRow {
    participate_id: number;
    name: string;
    start_date: string;
    start_end: string;
    state_participate_id: number;
}

/** Ganador de la última votación finalizada, para la sección "Ganador de la semana pasada". */
export interface IParticipateWinner {
    participate: IPublicParticipateRow;
    pack: IParticipatePackCard;
    /** Porcentaje de votos del ganador sobre el total de la votación. */
    percent: number;
    total_votes: number;
    /** El pack ya está publicado: se puede enlazar a /pack/<code>. */
    published: boolean;
}
