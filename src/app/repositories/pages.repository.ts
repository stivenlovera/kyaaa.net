import { IAdminPage, IFormPage, IPagePack } from "../types/page.types";
import { packImageUrl } from "../utils/pack-images";
import { PACK_TYPE, PAGE_TYPE, pageTypesWithoutPurchase, ZIP_LEVEL, ZipLevel } from "../utils/page-access";
import { prisma } from "../utils/prisma";

/** Alguna de las páginas de un guardado en bloque ya no existe (la borraron mientras se editaba). */
export class PageNotFoundError extends Error {
    constructor() {
        super("Alguna de las páginas ya no existe")
    }
}

/** Pack por código y si el usuario tiene acceso completo: pack gratuito o comprado por él. */
async function findPackAccess(code: string, user_id?: number) {
    const pack = await prisma.pack.findFirst({
        where: {
            code: code
        },
        select: {
            name: true,
            description: true,
            pack_id: true,
            code: true,
            pack_types: {
                select: {
                    type_id: true
                }
            }
        }
    });
    if (pack === null) {
        return null;
    }

    const isFreePack = pack.pack_types.some(({ type_id }) => type_id === PACK_TYPE.FREE);
    let fullAccess = isFreePack;
    if (!fullAccess && user_id !== undefined) {
        const buy = await prisma.buy_Pack.findFirst({
            select: {
                pack_id: true
            },
            where: {
                pack_id: pack.pack_id,
                user_id: user_id
            }
        });
        fullAccess = buy !== null;
    }
    return { pack, isFreePack, fullAccess };
}

/**
 * Pack "gratis para registrados": de pago (sin pack_type gratis), con páginas y ninguna "de pago", así que
 * cualquier usuario logueado lo ve y lo descarga entero sin comprar. No hay columna para esto: sale de los
 * tipos de página, así que vuelve a ser de pago en cuanto alguna página pase a "De pago".
 */
function freeForRegistered(isFreePack: boolean, total: number, buyPages: number): boolean {
    return !isFreePack && total > 0 && buyPages === 0;
}

export const repositoryPage = {

    /**
     * Páginas de un pack visibles para el usuario. Ve todas si el pack es gratuito o si lo compró;
     * si no, un anónimo ve solo las gratis (censuradas) y un usuario logueado las gratis y las de
     * registrados (sin censura).
     */
    findPagesPack: async (code: string, id_size: number, user_id?: number): Promise<IPagePack | null> => {
        const access = await findPackAccess(code, user_id);
        if (access === null) {
            return null;
        }
        const { pack, isFreePack, fullAccess } = access;
        const loggedIn = user_id !== undefined;
        const visibleTypes = pageTypesWithoutPurchase(loggedIn);

        const [pages, total, free, buyPages] = await Promise.all([
            prisma.page.findMany({
                where: {
                    pack_id: pack.pack_id,
                    ...(fullAccess ? {} : { page_type_id: { in: visibleTypes } })
                },
                orderBy: {
                    num: 'asc'
                },
                select: {
                    num: true,
                    page_type_id: true,
                    page_size: {
                        where: {
                            size_id: id_size
                        },
                        take: 1,
                        select: {
                            size: {
                                select: {
                                    extension: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.page.count({ where: { pack_id: pack.pack_id } }),
            prisma.page.count({ where: { pack_id: pack.pack_id, page_type_id: { in: visibleTypes } } }),
            prisma.page.count({ where: { pack_id: pack.pack_id, page_type_id: PAGE_TYPE.BUY } }),
        ]);

        return {
            name: pack.name,
            description: pack.description,
            pack_id: pack.pack_id,
            code: pack.code,
            // Un anónimo ve las gratis censuradas (URL pública); el resto sale firmado y sin censura.
            pages: await Promise.all(pages.map(async ({ num, page_type_id, page_size }) => ({
                num,
                page_size,
                url: page_size[0] === undefined ? '' : await packImageUrl({
                    code: pack.code,
                    size: page_size[0].size.name,
                    num,
                    extension: page_size[0].size.extension,
                    censored: !loggedIn && page_type_id === PAGE_TYPE.FREE,
                }),
            }))),
            total: total,
            free: isFreePack ? total : free,
            is_free: isFreePack,
            free_for_registered: freeForRegistered(isFreePack, total, buyPages),
            full_access: fullAccess,
        };
    },

    /** Si el pack es "gratis para registrados" (ver freeForRegistered): no se puede comprar. */
    isFreeForRegistered: async (pack_id: number): Promise<boolean> => {
        const [isFreePack, total, buyPages] = await Promise.all([
            prisma.pack_type.count({ where: { pack_id, type_id: PACK_TYPE.FREE } }).then((n) => n > 0),
            prisma.page.count({ where: { pack_id } }),
            prisma.page.count({ where: { pack_id, page_type_id: PAGE_TYPE.BUY } }),
        ]);
        return freeForRegistered(isFreePack, total, buyPages);
    },

    /**
     * ZIP que puede descargar un usuario logueado (mismas reglas que findPagesPack): el completo si el
     * pack es gratuito o lo compró; si no, el de páginas gratis y de registrados. null si el pack no existe.
     */
    /** Número total de imágenes del pack (todas, sin filtrar por acceso). */
    countByPack: async (pack_id: number): Promise<number> => {
        return await prisma.page.count({ where: { pack_id } });
    },

    findDownloadLevel: async (code: string, user_id: number): Promise<{ code: string, level: ZipLevel } | null> => {
        const access = await findPackAccess(code, user_id);
        if (access === null) {
            return null;
        }
        return {
            code: access.pack.code,
            level: access.fullAccess ? ZIP_LEVEL.FULL : ZIP_LEVEL.REGISTERED,
        };
    },

    /** Todas las páginas del pack para administración, sin filtrar por acceso del usuario. */
    findAllForAdmin: async (pack_id: number, code: string): Promise<IAdminPage[]> => {
        const pages = await prisma.page.findMany({
            where: { pack_id },
            orderBy: { num: 'asc' },
            select: {
                page_id: true,
                num: true,
                page_type_id: true,
                state: true,
                page_size: {
                    // Miniatura: alcanza con el tamaño "tumb" (size_id 1) para previsualizar.
                    where: { size_id: 1 },
                    take: 1,
                    select: { size: { select: { extension: true, name: true } } }
                }
            }
        })
        return Promise.all(pages.map(async (p) => ({
            page_id: p.page_id,
            num: p.num,
            page_type_id: p.page_type_id,
            state: p.state,
            url: p.page_size[0] === undefined ? '' : await packImageUrl({
                code,
                size: p.page_size[0].size.name,
                num: p.num,
                extension: p.page_size[0].size.extension,
                censored: p.page_type_id === PAGE_TYPE.FREE,
            }),
        })))
    },

    /**
     * Guarda varias páginas a la vez (admin, "Guardar cambios"), todo o nada. `num` es único por pack
     * (uq_page_pack_num), así que las que cambian de número pasan antes por un número temporal: si no,
     * intercambiar 01 y 02 chocaría a mitad de camino. Devuelve cuántas se guardaron.
     */
    updateMany: async (pages: IFormPage[]): Promise<number> => {
        const update_at = new Date()
        await prisma.$transaction(async (tx) => {
            const current = await tx.page.findMany({
                where: { page_id: { in: pages.map(({ page_id }) => page_id) } },
                select: { page_id: true, num: true },
            })
            if (current.length !== pages.length) {
                throw new PageNotFoundError()
            }
            const renamed = pages.filter(({ page_id, num }) => current.find((p) => p.page_id === page_id)?.num !== num)
            for (const [index, { page_id }] of renamed.entries()) {
                // varchar(5): "~" + índice en base 36 (los números reales son dígitos, no chocan).
                await tx.page.update({ where: { page_id }, data: { num: `~${index.toString(36)}` } })
            }
            for (const { page_id, num, page_type_id, state } of pages) {
                await tx.page.update({ where: { page_id }, data: { num, page_type_id, state, update_at } })
            }
        })
        return pages.length
    },

    /** Borra el registro de la página (y sus filas de page_size); no toca los archivos en S3. */
    delete: async (page_id: number): Promise<void> => {
        await prisma.$transaction([
            prisma.page_size.deleteMany({ where: { page_id } }),
            prisma.page.delete({ where: { page_id } }),
        ])
    }
}
