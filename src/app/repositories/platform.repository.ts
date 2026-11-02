import { IAdminPackPlatform, IPackPlatform, IPlatform } from "../types/platform.types";
import { packMediaUrl } from "../utils/pack-images";
import { prisma } from "../utils/prisma";

const PLATFORM_SELECT = { platform_id: true, name: true, slug: true } as const;

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

    findPoster: async (pack_id: number, platform_id: number): Promise<{ pack_platform_id: number } | null> => {
        return await prisma.pack_platform.findUnique({
            where: { pack_id_platform_id: { pack_id, platform_id } },
            select: { pack_platform_id: true },
        })
    },

    // Crea o actualiza el póster del pack para esa plataforma. `poster` solo cambia si se subió una imagen nueva.
    upsert: async (data: { pack_id: number, platform_id: number, url: string, title: string | null, sort: number, state: number, poster?: string }): Promise<void> => {
        const { pack_id, platform_id, poster, ...fields } = data;
        const now = new Date();
        await prisma.pack_platform.upsert({
            where: { pack_id_platform_id: { pack_id, platform_id } },
            create: { pack_id, platform_id, poster: poster!, ...fields, create_at: now, update_at: now },
            update: { ...fields, ...(poster !== undefined ? { poster } : {}), update_at: now },
        })
    },

    delete: async (pack_platform_id: number): Promise<void> => {
        await prisma.pack_platform.delete({ where: { pack_platform_id } })
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
}
