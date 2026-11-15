import { IAdminPackPlatform, IAdminPlatform, IAdminPackPostersPage, IAdminPlatformPage, IFormPlatform, IPackPlatform, IPlatform, PosterFilter } from "../types/platform.types";
import { packMediaUrl } from "../utils/pack-images";
import { prisma } from "../utils/prisma";

const PLATFORM_SELECT = { platform_id: true, name: true, slug: true, is_external: true, is_payment: true } as const;
const ADMIN_PLATFORM_SELECT = { ...PLATFORM_SELECT, base_url: true, state: true, update_at: true } as const;

export const repositoryPlatform = {

    findAll: async (): Promise<IPlatform[]> => {
        return await prisma.platform.findMany({
            where: { state: 1 },
            orderBy: { name: 'asc' },
            select: PLATFORM_SELECT,
        })
    },

    findById: async (platform_id: number): Promise<IPlatform | null> => {
        return await prisma.platform.findFirst({
            where: { platform_id, state: 1 },
            select: PLATFORM_SELECT,
        })
    },

    // Como findById pero también devuelve las inactivas (con su estado), para editar pósters ya existentes.
    findByIdWithState: async (platform_id: number): Promise<(IPlatform & { state: number }) | null> => {
        return await prisma.platform.findUnique({
            where: { platform_id },
            select: { ...PLATFORM_SELECT, state: true },
        })
    },

    // Pósters activos del pack, en el orden de `sort` (ascendente), para la ficha pública.
    findByPack: async (pack_id: number): Promise<IPackPlatform[]> => {
        const rows = await prisma.pack_platform.findMany({
            where: { pack_id, state: 1, platform: { state: 1 } },
            orderBy: [{ sort: 'asc' }, { pack_platform_id: 'asc' }],
            select: { pack_platform_id: true, poster: true, title: true, platform: { select: PLATFORM_SELECT } },
        })
        return rows.map((row) => ({ ...row, poster: packMediaUrl(row.poster)! }))
    },

    findAllForAdmin: async (pack_id: number): Promise<IAdminPackPlatform[]> => {
        const rows = await prisma.pack_platform.findMany({
            where: { pack_id },
            orderBy: [{ sort: 'asc' }, { pack_platform_id: 'asc' }],
            select: {
                pack_platform_id: true, poster: true, title: true, url: true, sort: true, clicks: true, state: true,
                platform: { select: PLATFORM_SELECT },
            },
        })
        return rows.map((row) => ({ ...row, poster: packMediaUrl(row.poster)! }))
    },

    // Póster por id (con la key guardada en BD), para editarlo o borrarlo.
    findPosterById: async (pack_platform_id: number): Promise<{ pack_id: number, platform_id: number, poster: string } | null> => {
        return await prisma.pack_platform.findUnique({
            where: { pack_platform_id },
            select: { pack_id: true, platform_id: true, poster: true },
        })
    },

    // Un pack puede tener varios pósters en la misma plataforma: cada uno es una fila propia.
    createPoster: async (data: { pack_id: number, platform_id: number, url: string, title: string | null, sort: number, state: number, poster: string }): Promise<void> => {
        const now = new Date();
        await prisma.pack_platform.create({ data: { ...data, create_at: now, update_at: now } })
    },

    // `poster` solo cambia si se subió una imagen nueva.
    updatePoster: async (pack_platform_id: number, data: { platform_id: number, url: string, title: string | null, sort: number, state: number, poster?: string }): Promise<void> => {
        const { poster, ...fields } = data;
        await prisma.pack_platform.update({
            where: { pack_platform_id },
            data: { ...fields, ...(poster !== undefined ? { poster } : {}), update_at: new Date() },
        })
    },

    // Borra el póster y devuelve la key de su imagen para quitarla del bucket.
    delete: async (pack_platform_id: number): Promise<string> => {
        const row = await prisma.pack_platform.delete({ where: { pack_platform_id }, select: { poster: true } })
        return row.poster
    },

    // Suma un clic y devuelve el destino; null si el póster no existe o está inactivo.
    registerClick: async (pack_platform_id: number): Promise<string | null> => {
        const row = await prisma.pack_platform.findFirst({
            where: { pack_platform_id, state: 1 },
            select: { url: true, update_at: true },
        })
        if (row === null) {
            return null
        }
        // update_at explícito: si no, el ON UPDATE de MariaDB lo movería en cada clic.
        await prisma.pack_platform.update({
            where: { pack_platform_id },
            data: { clicks: { increment: 1 }, update_at: row.update_at },
        })
        return row.url
    },

    // ---- Pósters agrupados por pack (/admin/pack-platform) ----

    findPacksWithPosters: async (page: number, pageSize: number, filter: PosterFilter): Promise<IAdminPackPostersPage> => {
        const where = filter === 'with'
            ? { pack_platforms: { some: {} } }
            : filter === 'without' ? { pack_platforms: { none: {} } } : {};
        const [rows, total] = await Promise.all([
            prisma.pack.findMany({
                where,
                orderBy: { pack_id: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    pack_id: true, name: true, code: true,
                    pack_platforms: {
                        orderBy: [{ sort: 'asc' }, { pack_platform_id: 'asc' }],
                        select: {
                            pack_platform_id: true, poster: true, title: true, url: true, sort: true, clicks: true, state: true,
                            platform: { select: PLATFORM_SELECT },
                        },
                    },
                },
            }),
            prisma.pack.count({ where }),
        ])
        const packs = rows.map(({ pack_platforms, ...pack }) => ({
            ...pack,
            items: pack_platforms.map((pp) => ({ ...pp, poster: packMediaUrl(pp.poster)! })),
            active: pack_platforms.filter((pp) => pp.state === 1).length,
            clicks: pack_platforms.reduce((sum, pp) => sum + pp.clicks, 0),
        }))
        return { packs, total }
    },

    // ---- Catálogo (/admin/platform) ----

    findPaginated: async (page: number, pageSize: number): Promise<IAdminPlatformPage> => {
        const [platforms, total] = await Promise.all([
            prisma.platform.findMany({
                orderBy: { name: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: ADMIN_PLATFORM_SELECT,
            }),
            prisma.platform.count(),
        ])
        return { platforms, total }
    },

    create: async (data: Omit<IFormPlatform, 'platform_id'>): Promise<IAdminPlatform> => {
        const now = new Date();
        return await prisma.platform.create({
            data: { ...data, create_at: now, update_at: now },
            select: ADMIN_PLATFORM_SELECT,
        })
    },

    update: async (platform_id: number, data: Omit<IFormPlatform, 'platform_id'>): Promise<IAdminPlatform> => {
        return await prisma.platform.update({
            where: { platform_id },
            data: { ...data, update_at: new Date() },
            select: ADMIN_PLATFORM_SELECT,
        })
    },

    deletePlatform: async (platform_id: number): Promise<void> => {
        await prisma.platform.delete({ where: { platform_id } })
    },

    findBySlug: async (slug: string, excludePlatformId?: number): Promise<{ platform_id: number } | null> => {
        return await prisma.platform.findFirst({
            where: {
                slug,
                ...(excludePlatformId !== undefined ? { platform_id: { not: excludePlatformId } } : {})
            },
            select: { platform_id: true },
        })
    },
}
