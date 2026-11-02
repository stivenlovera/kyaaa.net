
import { prisma } from '@/src/app/utils/prisma';
import { IAuth, IUser } from '../types/user.type';
import logger, { jsonLog } from '../utils/logger';
import bcrypt from 'bcryptjs';
import moment from 'moment';
import { ROL } from '../utils/page-access';

export const repositoryAuth = {
    /** Si el usuario tiene el rol admin en user_rol. Se consulta en cada petición (no se guarda en el JWT). */
    isAdmin: async (user_id: number): Promise<boolean> => {
        const rol = await prisma.user_Rol.findFirst({
            where: { user_id, rol_id: ROL.ADMIN },
            select: { rol_id: true }
        });
        return rol !== null;
    },


    findUserById: async (user_id: number): Promise<IUser | null> => {
        const user = await prisma.user.findFirst({
            where: {
                user_id: user_id
            }
        });

        return user || null;
    },

    findUserAuth: async (user_id: number): Promise<IAuth | null> => {
        const user = await prisma.user.findFirst({
            where: {
                user_id: user_id
            },
            select: {
                name: true,
                image: true,
                email: true,
                nick: true
            }
        });
        return user || null;
    },

    findUserNick: async (nick: string, user_id: number): Promise<IAuth | null> => {
        const user = await prisma.user.findFirst({
            where: {
                nick: nick,
                user_id: {
                    notIn: [user_id]
                }
            },
            select: {
                name: true,
                image: true,
                email: true,
                nick: true
            }
        });
        return user || null;
    },

    updateUser: async (nick: string, user_id: number, name: string): Promise<IAuth | null> => {
        logger.info(`repositoryAuth/updateUser ${jsonLog(nick)}`)
        const user = await prisma.user.update({
            where: {
                user_id: user_id
            },
            data: {
                name: name,
                nick: nick
            }
        });
        return user || null;
    },

    updateEmail: async (user_id: number, email: string): Promise<IAuth | null> => {
        logger.info(`repositoryAuth/updateEmail ${jsonLog([user_id, email])}`)
        const user = await prisma.user.update({
            where: {
                user_id: user_id
            },
            data: {
                email: email
            }
        });
        return user || null;
    },

    updatePassword: async (user_id: number, newPassword: string): Promise<IAuth | null> => {
        logger.info(`repositoryAuth/updatePassword ${jsonLog([user_id, newPassword])}`)
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user = await prisma.user.update({
            where: {
                user_id: user_id
            },
            data: {
                password: hashedPassword
            }
        });
        return user || null;
    },

    updateResetPassword: async (email: string, newPassword: string): Promise<IAuth | null> => {
        logger.info(`repositoryAuth/updateResetPassword ${jsonLog([email, newPassword])}`)
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user = await prisma.user.update({
            where: {
                email: email
            },
            data: {
                password: hashedPassword
            }
        });
        return user || null;
    },

    findUserEmail: async (email: string, user_id: number): Promise<IAuth | null> => {
        logger.info(`repositoryAuth/findUserEmail ${jsonLog([email, user_id])}`)
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                user_id: {
                    notIn: [user_id]
                }
            },
            select: {
                name: true,
                image: true,
                email: true,
                nick: true
            }
        });
        return user || null;
    },

    findEmail: async (email: string): Promise<IAuth | null> => {
        logger.info(`repositoryAuth/findUserEmail ${jsonLog([email])}`)
        const user = await prisma.user.findFirst({
            where: {
                email: email,
            },
            select: {
                name: true,
                image: true,
                email: true,
                nick: true
            }
        });
        return user || null;
    },

    updateImgProfile: async (user_id: number, image: string | null): Promise<IAuth | null> => {
        logger.info(`repositoryAuth/updateProfile ${jsonLog(user_id)}`)
        const user = await prisma.user.update({
            where: {
                user_id: user_id
            },
            data: {
                image: image!,
            }
        });
        return user || null;
    },

    updateVerifiedEmail: async (email: string): Promise<IAuth | null> => {
        logger.info(`repositoryAuth/updateVerifiedEmail ${jsonLog(email)}`)
        const user = await prisma.user.update({
            where: {
                email: email
            },
            data: {
                verified_email: moment().toDate(),
            }
        });
        return user || null;
    },

    findUserByEmail: async (email: string): Promise<IUser | null> => {
        const user = await prisma.user.findFirst({
            select: {
                user_id: true,
                email: true,
                name: true,
                nick: true,
                image: true,
                state: true,
                verified_email: true,
                password: true,
                create_at: true,
                update_at: true
            },
            where: {
                email: email
            }
        });
        if (user === null) {
            return null;
        }
        return user;
    },

    createUser: async (name: string, email: string, password: string): Promise<IUser> => {
        const hashedPassword = await bcrypt.hash(password, 10);
        /* const atIndex = email.indexOf("@");
        const username = email.substring(0, atIndex); */
        const uniqueTimestamp: string = new Date().getTime().toString();
        const nuevoUsuario = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                user_id: 0,
                nick: 'user' + uniqueTimestamp,
                image: "new_user.png"
            },
        });
        return nuevoUsuario;
    },

    verifyPassword: async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
        logger.info(`repositoryAuth/verifyPassword ${jsonLog([plainPassword, hashedPassword])}`)
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    // Remove password from user object
    sanitizeUser: (user: IUser): Omit<IUser, 'password'> => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },
};