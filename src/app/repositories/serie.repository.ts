import { ICountTag } from "../[locale]/pack/_components/card-section";
import { IListPacks } from "../types/pack.types";
import { IAdminSerie, IAdminSeriePage, ISerie } from "../types/serie.types";
import { packPortada } from "../utils/pack-portada";
import { STATE_PACK } from "../utils/page-access";
import { prisma } from "../utils/prisma";

export const repositorySerie = {

    findTotal: async (serie_id: number[]): Promise<ICountTag[] | null> => {
        const query = `
        select count(pack.pack_id) as count, serie.name, serie.slug from pack 
        inner join pack_serie on pack_serie.pack_id = pack.pack_id 
        inner join serie on serie.serie_id = pack_serie.serie_id
        where serie.serie_id in (${serie_id})
        group by serie.serie_id; `
        const result = await prisma.$queryRawUnsafe<ICountTag[]>(query);

        const serializedResults = result.map(row => ({
            name: (row.name),
            slug: (row.slug),       // Converts 1n to 1
            count: Number(row.count)    // Converts 2n to 2
        }));
        return serializedResults;
    },

    findAllAndTotal: async (): Promise<ISerie[] | null> => {
        const query = `
                select 
                serie.serie_id,
                serie.name, 
                serie.slug, 
                coalesce(packs.total,0) as total
                from serie 
                    left join (
                    select pack_serie.serie_id, count(*) as total from pack_serie group by pack_serie.serie_id
                ) as packs
                    on packs.serie_id=serie.serie_id 
                ;
            `
        const characters = await prisma.$queryRawUnsafe<ISerie[]>(query);
        return characters;
    },

    findAllPerSerie: async (slug: string, loggedIn: boolean): Promise<IListPacks[] | null> => {
        const packs = await prisma.pack.findMany({
            select: {
                name: true,
                description: true,
                pack_id: true,
                code: true,
                pack_serie: { select: { serie: { select: { name: true, serie_id: true } } } },
                pack_character: { select: { character: { select: { name: true, character_id: true } } } },
                pages: {
                    // Portada: prefiere una página gratis (page_type 1) y luego la de menor número.
                    orderBy: [{ page_type_id: 'asc' }, { num: 'asc' }],
                    take: 1,
                    select: {
                        num: true,
                        page_type_id: true,
                        page_size: {
                            where: {
                                size_id: 1
                            },
                            select: {
                                size: {
                                    select: {
                                        extension: true,
                                        name: true
                                    }
                                }
                            }
                        },
                    }
                },
            },
            where: {
                // Solo packs publicados; "próximamente" y "borrador" no salen en el listado.
                state_pack_id: STATE_PACK.PUBLISHED,
                pack_serie: {
                    some: {
                        serie: {
                            slug: slug
                        }
                    }
                }
            }
        })
        const listPacks = await Promise.all(packs.map(async (p) => {
            const pack: IListPacks = {
                ...p,
                portada: await packPortada(p.code, p.pages[0], loggedIn)
            }
            return pack
        }))
        return listPacks
    },

    findPaginated: async (page: number, pageSize: number): Promise<IAdminSeriePage> => {
        const [series, total] = await Promise.all([
            prisma.serie.findMany({
                orderBy: { name: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    serie_id: true,
                    name: true,
                    slug: true,
                    state: true,
                    update_at: true,
                }
            }),
            prisma.serie.count(),
        ])
        return { series, total }
    },

    create: async (name: string, slug: string, state: number): Promise<IAdminSerie> => {
        return await prisma.serie.create({
            data: { name, slug, state, create_at: new Date(), update_at: new Date() },
            select: { serie_id: true, name: true, slug: true, state: true, update_at: true }
        })
    },

    update: async (serie_id: number, name: string, slug: string, state: number): Promise<IAdminSerie> => {
        return await prisma.serie.update({
            where: { serie_id },
            data: { name, slug, state, update_at: new Date() },
            select: { serie_id: true, name: true, slug: true, state: true, update_at: true }
        })
    },

    delete: async (serie_id: number): Promise<void> => {
        await prisma.serie.delete({ where: { serie_id } })
    },

    findBySlug: async (slug: string, excludeSerieId?: number): Promise<{ serie_id: number } | null> => {
        return await prisma.serie.findFirst({
            where: {
                slug,
                ...(excludeSerieId !== undefined ? { serie_id: { not: excludeSerieId } } : {})
            },
            select: { serie_id: true }
        })
    }
}