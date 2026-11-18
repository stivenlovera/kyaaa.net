import { IAdminParticipate, IAdminParticipatePack, IAdminParticipatePage, IParticipatePackCard, IParticipateWinner, IPublicParticipateRow, IStateParticipate } from "../types/participate.types";
import { Prisma } from "../../../generated/prisma/client";
import { IListPacks } from "../types/pack.types";
import { packMediaUrl } from "../utils/pack-images";
import { STATE_PACK, STATE_PACK_PARTICIPATE, STATE_PARTICIPATE } from "../utils/page-access";
import { prisma } from "../utils/prisma";
import { PACK_LIST_SELECT, toListPack } from "./pack.repository";

/** Participación de /participate antes de añadir los flags del usuario (like/favorito/compra) a sus packs. */
export interface IPublicParticipateBase extends IPublicParticipateRow {
    packs: IParticipatePackCard[];
}

interface IParticipateRow extends Omit<IAdminParticipate, 'total_packs' | 'total_votes'> {
    total_packs: bigint | number;
    total_votes: bigint | number;
}

// start_date/start_end son columnas `date`: se leen ya formateadas con DATE_FORMAT para que la
// zona horaria del driver no las corra un día.
const PARTICIPATE_SELECT = `
    select
        participate.participate_id,
        participate.name,
        date_format(participate.start_date, '%Y-%m-%d') as start_date,
        date_format(participate.start_end, '%Y-%m-%d') as start_end,
        participate.state_participate_id,
        state_participate.name as state_name,
        participate.update_at,
        (select count(*) from participate_pack where participate_pack.participate_id = participate.participate_id) as total_packs,
        (select count(*) from vote
            inner join participate_pack on participate_pack.participate_pack_id = vote.participate_pack_id
            where participate_pack.participate_id = participate.participate_id) as total_votes
    from participate
    inner join state_participate on state_participate.state_participate_id = participate.state_participate_id
`

const toParticipate = (row: IParticipateRow): IAdminParticipate => ({
    ...row,
    total_packs: Number(row.total_packs),
    total_votes: Number(row.total_votes),
})

/** 'YYYY-MM-DD' → Date a mediodía UTC: al guardarse en una columna `date` conserva el día con cualquier zona horaria. */
const toDate = (value: string): Date => new Date(`${value}T12:00:00Z`)

// Campos de un participate_pack para pintar su tarjeta en /participate.
const PARTICIPATE_PACK_CARD_SELECT = {
    participate_pack_id: true,
    participate_id: true,
    _count: { select: { votes: true } },
    pack: {
        select: {
            ...PACK_LIST_SELECT,
            state_pack_id: true,
            pack_label: { select: { label: { select: { name: true, label_id: true } } } },
            // Pósters activos: el carrusel del modal y la portada de respaldo (ver toParticipatePackCard).
            pack_platforms: {
                where: { state: 1, platform: { state: 1 } },
                orderBy: [{ sort: 'asc' }, { pack_platform_id: 'asc' }],
                select: { poster: true },
            },
        },
    },
} satisfies Prisma.Participate_PackSelect;

type ParticipatePackCardRow = Prisma.Participate_PackGetPayload<{ select: typeof PARTICIPATE_PACK_CARD_SELECT }>;

// Un pack en votación (borrador) suele no tener páginas todavía, o ninguna gratis que un anónimo pueda ver:
// entonces la portada es su primer póster activo (imágenes aptas, sin contenido adulto). Si tampoco tiene
// póster, la tarjeta muestra un hueco en lugar de la imagen. Los pósters van además completos para el
// carrusel del modal.
async function toParticipatePackCard(row: ParticipatePackCardRow, loggedIn: boolean): Promise<IParticipatePackCard> {
    const { pack_platforms, pack_label, ...packRow } = row.pack
    const listPack: IListPacks = packRow.pages.length > 0
        ? await toListPack(packRow, loggedIn)
        : { ...packRow, portada: { num: '', extension: '', name: '', url: '' } }
    const posters = pack_platforms.map((pp) => packMediaUrl(pp.poster)!)
    return {
        ...listPack,
        portada: { ...listPack.portada, url: listPack.portada.url || posters[0] || '' },
        posters,
        pack_label,
        participate_pack_id: row.participate_pack_id,
        votes: row._count.votes,
    }
}

export const repositoryParticipate = {

    findStates: async (): Promise<IStateParticipate[]> => {
        return await prisma.state_Participate.findMany({
            orderBy: { state_participate_id: 'asc' },
            select: { state_participate_id: true, name: true },
        })
    },

    findPaginated: async (page: number, pageSize: number): Promise<IAdminParticipatePage> => {
        const [rows, total] = await Promise.all([
            prisma.$queryRawUnsafe<IParticipateRow[]>(
                `${PARTICIPATE_SELECT} order by participate.start_date desc, participate.participate_id desc limit ? offset ?`,
                pageSize,
                (page - 1) * pageSize,
            ),
            prisma.participate.count(),
        ])
        return { participates: rows.map(toParticipate), total }
    },

    findById: async (participate_id: number): Promise<IAdminParticipate | null> => {
        const rows = await prisma.$queryRawUnsafe<IParticipateRow[]>(
            `${PARTICIPATE_SELECT} where participate.participate_id = ?`,
            participate_id,
        )
        return rows.length === 0 ? null : toParticipate(rows[0])
    },

    create: async (name: string, start_date: string, start_end: string, state_participate_id: number): Promise<{ participate_id: number }> => {
        const now = new Date()
        return await prisma.participate.create({
            data: { name, start_date: toDate(start_date), start_end: toDate(start_end), state_participate_id, create_at: now, update_at: now },
            select: { participate_id: true },
        })
    },

    update: async (participate_id: number, name: string, start_date: string, start_end: string, state_participate_id: number): Promise<{ participate_id: number }> => {
        return await prisma.participate.update({
            where: { participate_id },
            data: { name, start_date: toDate(start_date), start_end: toDate(start_end), state_participate_id, update_at: new Date() },
            select: { participate_id: true },
        })
    },

    countVotes: async (participate_id: number): Promise<number> => {
        return await prisma.vote.count({ where: { participate_pack: { participate_id } } })
    },

    // Borra la participación junto con sus packs inscritos. La API solo lo permite si no hay votos.
    delete: async (participate_id: number): Promise<void> => {
        await prisma.$transaction([
            prisma.participate_Pack.deleteMany({ where: { participate_id } }),
            prisma.participate.delete({ where: { participate_id } }),
        ])
    },

    // ---- Página pública /participate ----

    // Participaciones en curso y finalizadas (los borradores no se muestran): primero las en curso y,
    // dentro de cada estado, la más reciente primero. Cada una con sus packs en estado "borrador"
    // (los únicos que se votan; el resto no se muestra) y los votos de cada pack, el más votado primero.
    findPublic: async (loggedIn: boolean): Promise<IPublicParticipateBase[]> => {
        const participates = await prisma.$queryRawUnsafe<IPublicParticipateRow[]>(`
            select
                participate_id,
                name,
                date_format(start_date, '%Y-%m-%d') as start_date,
                date_format(start_end, '%Y-%m-%d') as start_end,
                state_participate_id
            from participate
            where state_participate_id <> ?
            order by (state_participate_id = ?) desc, start_date desc, participate_id desc
        `, STATE_PARTICIPATE.DRAFT, STATE_PARTICIPATE.ACTIVE)
        if (participates.length === 0) {
            return []
        }
        const rows = await prisma.participate_Pack.findMany({
            where: {
                participate_id: { in: participates.map((p) => p.participate_id) },
                pack: { state_pack_id: STATE_PACK_PARTICIPATE },
            },
            orderBy: { participate_pack_id: 'asc' },
            select: PARTICIPATE_PACK_CARD_SELECT,
        })
        const packs = await Promise.all(rows.map(async (row) => ({
            participate_id: row.participate_id,
            pack: await toParticipatePackCard(row, loggedIn),
        })))
        return participates.map((participate) => ({
            ...participate,
            packs: packs
                .filter((p) => p.participate_id === participate.participate_id)
                .map((p) => p.pack)
                .sort((a, b) => b.votes - a.votes),
        }))
    },

    // Ganador de la última votación finalizada (la de fecha de fin más reciente): el pack con más votos.
    // Cuenta todos sus packs, sea cual sea su estado actual: participan en borrador, pero el ganador suele
    // pasar después a "publicado". Con empate gana el que se agregó primero a la votación. null si no hay
    // votación finalizada o nadie votó.
    findLastWinner: async (loggedIn: boolean): Promise<IParticipateWinner | null> => {
        const [participate] = await prisma.$queryRawUnsafe<IPublicParticipateRow[]>(`
            select
                participate_id,
                name,
                date_format(start_date, '%Y-%m-%d') as start_date,
                date_format(start_end, '%Y-%m-%d') as start_end,
                state_participate_id
            from participate
            where state_participate_id = ?
            order by start_end desc, participate_id desc
            limit 1
        `, STATE_PARTICIPATE.FINISHED)
        if (participate === undefined) {
            return null
        }
        const rows = await prisma.participate_Pack.findMany({
            where: { participate_id: participate.participate_id },
            orderBy: { participate_pack_id: 'asc' },
            select: PARTICIPATE_PACK_CARD_SELECT,
        })
        const total_votes = rows.reduce((sum, row) => sum + row._count.votes, 0)
        if (total_votes === 0) {
            return null
        }
        // reduce conserva el primero ante empates (orden de participate_pack_id).
        const winner = rows.reduce((best, row) => (row._count.votes > best._count.votes ? row : best))
        return {
            participate,
            pack: await toParticipatePackCard(winner, loggedIn),
            percent: Math.round((winner._count.votes * 100) / total_votes),
            total_votes,
            published: winner.pack.state_pack_id === STATE_PACK.PUBLISHED,
        }
    },

    // ---- Votos (/participate) ----

    // Pack votado por el usuario en cada votación: participate_id → participate_pack_id.
    findUserVotes: async (user_id: number, participate_ids: number[]): Promise<Map<number, number>> => {
        if (participate_ids.length === 0) {
            return new Map()
        }
        const votes = await prisma.vote.findMany({
            where: { user_id, participate_pack: { participate_id: { in: participate_ids } } },
            select: { participate_pack_id: true, participate_pack: { select: { participate_id: true } } },
        })
        return new Map(votes.map((v) => [v.participate_pack.participate_id, v.participate_pack_id]))
    },

    // Datos para validar un voto: la votación, su estado y el estado del pack.
    findVoteTarget: async (participate_pack_id: number): Promise<{ participate_id: number, state_participate_id: number, state_pack_id: number } | null> => {
        const row = await prisma.participate_Pack.findUnique({
            where: { participate_pack_id },
            select: {
                participate_id: true,
                participate: { select: { state_participate_id: true } },
                pack: { select: { state_pack_id: true } },
            },
        })
        return row === null ? null : {
            participate_id: row.participate_id,
            state_participate_id: row.participate.state_participate_id,
            state_pack_id: row.pack.state_pack_id,
        }
    },

    // Un voto por usuario y votación: borra el voto que tuviera en esa votación y, si no era el mismo
    // pack, vota este (volver a votar el mismo pack lo quita). La fila de la votación se bloquea
    // (FOR UPDATE) para que dos peticiones a la vez no dejen dos votos del mismo usuario.
    // Devuelve el pack votado (o null si se quitó) y los votos de cada pack de la votación.
    toggleVote: async (user_id: number, participate_id: number, participate_pack_id: number): Promise<{ voted: number | null, votes: Record<number, number> }> => {
        return await prisma.$transaction(async (tx) => {
            await tx.$queryRawUnsafe('select participate_id from participate where participate_id = ? for update', participate_id)
            const previous = await tx.vote.findFirst({
                where: { user_id, participate_pack: { participate_id } },
                select: { participate_pack_id: true },
            })
            await tx.vote.deleteMany({ where: { user_id, participate_pack: { participate_id } } })
            let voted: number | null = null
            if (previous?.participate_pack_id !== participate_pack_id) {
                const now = new Date()
                await tx.vote.create({ data: { user_id, participate_pack_id, create_at: now, update_at: now } })
                voted = participate_pack_id
            }
            const counts = await tx.participate_Pack.findMany({
                where: { participate_id },
                select: { participate_pack_id: true, _count: { select: { votes: true } } },
            })
            return { voted, votes: Object.fromEntries(counts.map((c) => [c.participate_pack_id, c._count.votes])) }
        })
    },

    // ---- participate_pack ----

    findPacks: async (participate_id: number): Promise<IAdminParticipatePack[]> => {
        const rows = await prisma.participate_Pack.findMany({
            where: { participate_id },
            orderBy: { participate_pack_id: 'asc' },
            select: {
                participate_pack_id: true,
                create_at: true,
                pack: { select: { pack_id: true, name: true, code: true, state_pack_id: true, state_pack: { select: { name: true } } } },
                _count: { select: { votes: true } },
            },
        })
        return rows.map((row) => ({
            participate_pack_id: row.participate_pack_id,
            pack_id: row.pack.pack_id,
            name: row.pack.name,
            code: row.pack.code,
            state_pack_id: row.pack.state_pack_id,
            state_pack_name: row.pack.state_pack?.name ?? null,
            votes: row._count.votes,
            create_at: row.create_at,
        }))
    },

    findPackState: async (pack_id: number): Promise<number | null> => {
        const pack = await prisma.pack.findUnique({ where: { pack_id }, select: { state_pack_id: true } })
        return pack?.state_pack_id ?? null
    },

    findParticipatePack: async (participate_id: number, pack_id: number): Promise<{ participate_pack_id: number } | null> => {
        return await prisma.participate_Pack.findFirst({
            where: { participate_id, pack_id },
            select: { participate_pack_id: true },
        })
    },

    addPack: async (participate_id: number, pack_id: number): Promise<void> => {
        const now = new Date()
        await prisma.participate_Pack.create({
            data: { participate_id, pack_id, create_at: now, update_at: now },
        })
    },

    countPackVotes: async (participate_pack_id: number): Promise<number> => {
        return await prisma.vote.count({ where: { participate_pack_id } })
    },

    removePack: async (participate_pack_id: number): Promise<void> => {
        await prisma.participate_Pack.delete({ where: { participate_pack_id } })
    },
}
