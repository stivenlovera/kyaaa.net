'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import AuthContext from './AuthContext';
import { useAuth } from '../common/useAuth';
import { IAuth } from '../app/types/user.type';

export const AuthProvider = ({ children, auth }: { children: React.ReactNode, auth: IAuth | null }) => {
    const { user, login, logout, checkAuth } = useAuth(auth);
    const router = useRouter();
    const signIn = async (email: string, password: string) => {
        return await login(email, password)
    }

    // Primero se borran las cookies (await) y después se vacía la caché del router: las páginas ya
    // visitadas se renderizaron con la sesión (imágenes privadas con URL firmada) y, sin refresh,
    // Next las volvería a mostrar al navegar hasta recargar con F5.
    const signOut = async () => {
        await logout()
        router.refresh()
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};