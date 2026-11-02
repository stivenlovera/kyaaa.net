import { ICountTag } from "../[locale]/pack/_components/card-section";
import { IAdminCharacter, IAdminCharacterPage, ICharacter } from "../types/character.types";
import { IListPacks } from "../types/pack.types";
import { packPortada } from "../utils/pack-portada";
import { STATE_PACK } from "../utils/page-access";
import { prisma } from "../utils/prisma";

export const repositoryCharacter = {

    findTotal: async (character_id: number[]): Promise<ICountTag[] | null> => {
        const query = `
        select count(pack.pack_id) as count, \`character\`.name, \`character\`.slug  from pack 
        inner join pack_character on pack_character.pack_id = pack.pack_id 
        inner join \`character\` on \`character\`.character_id = pack_character.character_id
        where \`character\`.character_id in (${character_id})
        group by \`character\`.character_id; `
        const result = await prisma.$queryRawUnsafe<ICountTag[]>(query);

        const serializedResults = result.map(row => ({
            name: (row.name),
            slug: (row.slug),        // Converts 1n to 1
            count: Number(row.count)    // Converts 2n to 2
        }));
        return serializedResults;
    },

    findAllAndTotal: async (): Promise<ICharacter[] | null> => {
        const query = `
                    select 
                    \`character\`.character_id,
                    \`character\`.name, 
                    \`character\`.slug, 
                    coalesce(packs.total,0) as total
                    from \`character\` 
                     left join (
						select pack_character.character_id, count(*) as total from pack_character group by pack_character.character_id
                    ) as packs
                     on packs.character_id=\`character\`.character_id 
                    ;
        `
        const characters = await prisma.$queryRawUnsafe<ICharacter[]>(query);
        return characters;
    },

    findAllPerCharacter: async (slug: string, loggedIn: boolean): Promise<IListPacks[] | null> => {
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
                pack_character: {
                    some: {
                        character: {
                            slug: slug
                        }
                    }
                }
            }
        })
        const newPacks = await Promise.all(packs.map(async (p) => {
            const pack: IListPacks = {
                ...p,
                portada: await packPortada(p.code, p.pages[0], loggedIn)
            }
            return pack
        }))
        return newPacks
    },

    findPaginated: async (page: number, pageSize: number): Promise<IAdminCharacterPage> => {
        const [characters, total] = await Promise.all([
            prisma.character.findMany({
                orderBy: { name: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    character_id: true,
                    name: true,
                    slug: true,
                    state: true,
                    update_at: true,
                }
            }),
            prisma.character.count(),
        ])
        return { characters, total }
    },

    create: async (name: string, slug: string, state: number): Promise<IAdminCharacter> => {
        return await prisma.character.create({
            data: { name, slug, state, create_at: new Date(), update_at: new Date() },
            select: { character_id: true, name: true, slug: true, state: true, update_at: true }
        })
    },

    update: async (character_id: number, name: string, slug: string, state: number): Promise<IAdminCharacter> => {
        return await prisma.character.update({
            where: { character_id },
            data: { name, slug, state, update_at: new Date() },
            select: { character_id: true, name: true, slug: true, state: true, update_at: true }
        })
    },

    delete: async (character_id: number): Promise<void> => {
        await prisma.character.delete({ where: { character_id } })
    },

    findBySlug: async (slug: string, excludeCharacterId?: number): Promise<{ character_id: number } | null> => {
        return await prisma.character.findFirst({
            where: {
                slug,
                ...(excludeCharacterId !== undefined ? { character_id: { not: excludeCharacterId } } : {})
            },
            select: { character_id: true }
        })
    }
}