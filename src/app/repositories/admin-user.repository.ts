import bcrypt from 'bcryptjs';
import { IAdminUser, IAdminUserPage } from "../types/admin-user.types";
import { ROL } from "../utils/page-access";
import { prisma } from "../utils/prisma";

// CRUD de usuarios para /admin/user. La contraseña nunca sale de aquí: solo se guarda con bcrypt
// (mismo coste que el registro, ver auth.repository.ts).

const ADMIN_USER_SELECT = {
    user_id: true, name: true, nick: true, email: true, state: true, verified_email: true, create_at: true,
    user_rols: { where: { rol_id: ROL.ADMIN }, select: { rol_id: true } },
    _count: { select: { buyPacks: true } },
} as const;

type AdminUserRow = {
    user_id: number, name: string, nick: string, email: string, state: number, verified_email: Date | null, create_at: Date,
    user_rols: { rol_id: number }[], _count: { buyPacks: number },
}

const toAdminUser = ({ user_rols, _count, ...user }: AdminUserRow): IAdminUser => ({
    ...user,
    is_admin: user_rols.length > 0,
    total_buys: _count.buyPacks,
})

interface IUserData {
    name: string
    nick: string
    email: string
    state: number
    verified: boolean
}

export const repositoryAdminUser = {

    // `search` filtra por nombre, nick o email (la intercalación de MariaDB ya ignora mayúsculas).
    findPaginated: async (page: number, pageSize: number, search?: string): Promise<IAdminUserPage> => {
        const where = search
            ? { OR: [{ name: { contains: search } }, { nick: { contains: search } }, { email: { contains: search } }] }
            : {};
        const [rows, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { user_id: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: ADMIN_USER_SELECT,
            }),
            prisma.user.count({ where }),
        ])
        return { users: rows.map(toAdminUser), total }
    },

    findById: async (user_id: number): Promise<IAdminUser | null> => {
        const row = await prisma.user.findUnique({ where: { user_id }, select: ADMIN_USER_SELECT })
        return row === null ? null : toAdminUser(row)
    },

    findByEmail: async (email: string, excludeUserId?: number): Promise<{ user_id: number } | null> => {
        return await prisma.user.findFirst({
            where: { email, ...(excludeUserId !== undefined ? { user_id: { not: excludeUserId } } : {}) },
            select: { user_id: true },
        })
    },

    create: async (data: IUserData & { password: string, is_admin: boolean }): Promise<IAdminUser> => {
        const now = new Date();
        const user = await prisma.user.create({
            data: {
                name: data.name,
                nick: data.nick,
                email: data.email,
                password: await bcrypt.hash(data.password, 10),
                state: data.state,
                verified_email: data.verified ? now : null,
                image: 'new_user.png',
                create_at: now,
                update_at: now,
                ...(data.is_admin ? { user_rols: { create: { rol_id: ROL.ADMIN, create_at: now, update_at: now } } } : {}),
            },
            select: ADMIN_USER_SELECT,
        })
        return toAdminUser(user)
    },

    // `password` solo cambia si llega. Marcar "verificado" conserva la fecha si ya lo estaba.
    update: async (user_id: number, data: IUserData & { password?: string, is_admin: boolean }): Promise<IAdminUser> => {
        const now = new Date();
        const current = await prisma.user.findUniqueOrThrow({ where: { user_id }, select: { verified_email: true } })
        await prisma.$transaction([
            prisma.user.update({
                where: { user_id },
                data: {
                    name: data.name,
                    nick: data.nick,
                    email: data.email,
                    state: data.state,
                    verified_email: data.verified ? (current.verified_email ?? now) : null,
                    ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
                    update_at: now,
                },
            }),
            prisma.user_Rol.deleteMany({ where: { user_id, rol_id: ROL.ADMIN } }),
            ...(data.is_admin ? [prisma.user_Rol.create({ data: { user_id, rol_id: ROL.ADMIN, create_at: now, update_at: now } })] : []),
        ])
        return (await repositoryAdminUser.findById(user_id))!
    },

    // Borra el usuario con sus votos, me gusta, favoritos y roles. Las compras no se borran: la API no
    // permite eliminar a un usuario que tenga compras (se desactiva en su lugar).
    delete: async (user_id: number): Promise<void> => {
        await prisma.$transaction([
            prisma.vote.deleteMany({ where: { user_id } }),
            prisma.like_Pack.deleteMany({ where: { user_id } }),
            prisma.favorite_Pack.deleteMany({ where: { user_id } }),
            prisma.user_Rol.deleteMany({ where: { user_id } }),
            prisma.user.delete({ where: { user_id } }),
        ])
    },
}
