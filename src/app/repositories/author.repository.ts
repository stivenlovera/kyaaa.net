import { ICountTag } from "../[locale]/pack/_components/card-section";
import { IAdminAuthor, IAdminAuthorPage, IAuthor } from "../types/author.types";
import { IListPacks } from "../types/pack.types";
import { packPortada } from "../utils/pack-portada";
import { STATE_PACK } from "../utils/page-access";
import { prisma } from "../utils/prisma";

export const repositoryAuthor = {

    findTotal: async (author_id: number[]): Promise<ICountTag[] | null> => {
        const query = `
         select count(pack.pack_id) as count, author.name, author.slug from pack 
        inner join pack_author on pack_author.pack_id = pack.pack_id 
        inner join author on author.author_id = pack_author.author_id
        where author.author_id in (${author_id})
        group by author.author_id; `
        const result = await prisma.$queryRawUnsafe<ICountTag[]>(query);

        const serializedResults = result.map(row => ({
            name: (row.name), 
            slug: (row.slug),         // Converts 1n to 1
            count: Number(row.count)    // Converts 2n to 2
        }));
        return serializedResults;
    },

    findAllAndTotal: async (): Promise<IAuthor[] | null> => {
        const query = `
                    select 
                    author.author_id,
                    author.name, 
                    author.slug, 
                    coalesce(packs.total,0) as total
                    from author 
                        left join (
                        select pack_author.author_id, count(*) as total from pack_author group by pack_author.author_id
                    ) as packs
                        on packs.author_id=author.author_id 
                    ;
                `
        const characters = await prisma.$queryRawUnsafe<IAuthor[]>(query);
        return characters;
    },

    findAllPerAuthor: async (slug: string, loggedIn: boolean): Promise<IListPacks[] | null> => {
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
                pack_authors: {
                    some: {
                        author: {
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

    findPaginated: async (page: number, pageSize: number): Promise<IAdminAuthorPage> => {
        const [authors, total] = await Promise.all([
            prisma.author.findMany({
                orderBy: { name: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    author_id: true,
                    name: true,
                    slug: true,
                    state: true,
                    update_at: true,
                }
            }),
            prisma.author.count(),
        ])
        return { authors, total }
    },

    create: async (name: string, slug: string, state: number): Promise<IAdminAuthor> => {
        return await prisma.author.create({
            data: { name, slug, state, create_at: new Date(), update_at: new Date() },
            select: { author_id: true, name: true, slug: true, state: true, update_at: true }
        })
    },

    update: async (author_id: number, name: string, slug: string, state: number): Promise<IAdminAuthor> => {
        return await prisma.author.update({
            where: { author_id },
            data: { name, slug, state, update_at: new Date() },
            select: { author_id: true, name: true, slug: true, state: true, update_at: true }
        })
    },

    delete: async (author_id: number): Promise<void> => {
        await prisma.author.delete({ where: { author_id } })
    },

    findBySlug: async (slug: string, excludeAuthorId?: number): Promise<{ author_id: number } | null> => {
        return await prisma.author.findFirst({
            where: {
                slug,
                ...(excludeAuthorId !== undefined ? { author_id: { not: excludeAuthorId } } : {})
            },
            select: { author_id: true }
        })
    }
}