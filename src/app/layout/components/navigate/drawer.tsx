'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { ListMenu } from '../../layout.type'
import { IAuth } from '@/src/app/types/user.type'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/providers/AuthContext'
import { useTranslations } from 'next-intl'
interface DrawerProps {
    openDrawer: boolean
    onDrawerClose: () => void
    user: IAuth
}
const Drawer = ({ openDrawer, onDrawerClose, user }: DrawerProps) => {
    const t = useTranslations('header.menu');
    const ta = useTranslations('header.menu.auth');
    const router = useRouter();
    const { signOut } = useAuth()
    const [menu] = useState<ListMenu[]>([
        {
            name: t('nuevo'),
            url: '/'
        },
        {
            name: t('participa'),
            url: '/participate'
        },
        {
            name: t('serie'),
            url: '/serie'
        },
        {
            name: t('personaje'),
            url: '/character'
        },
        {
            name: t('etiqueta'),
            url: '/label'
        },
        {
            name: t('autor'),
            url: '/author'
        }
    ]);
    return (
        <>
            <div className={`${!openDrawer && "hidden"} bg-dark-600/50 min-h-screen w-full fixed top-0 left-0 right-0 backdrop-blur-sm`} onClick={() => onDrawerClose()}></div>
            <div className={`${openDrawer ? "w-80" : "w-0"} bg-neutral-800 min-h-screen fixed top-0 left-0 transition-all duration-300`}>
                <div className={`${!openDrawer && "hidden"} pt-3 text-center `}>
                    {
                        menu.map((menu, i) => {
                            return (
                                <div className='p-1' key={i}>
                                    <Link
                                        href={menu.url}
                                        className="block p-3 hover:text-blue-400 hover:bg-blue-950"
                                        onClick={() => { onDrawerClose() }}
                                    >
                                        {menu.name}
                                    </Link>
                                </div>
                            )
                        })
                    }
                    <div className='p-1'>
                        <hr />
                        {user !== null ? (
                            <div className=' '>
                                <Link
                                    href={'/my-purchases'}
                                    className="block p-3 hover:text-blue-400 hover:bg-blue-950"
                                    onClick={() => { onDrawerClose() }}
                                >
                                    {ta('mis_compra')}
                                </Link>
                                <Link
                                    href={'/favorites'}
                                    className="block p-3 hover:text-blue-400 hover:bg-blue-950"
                                    onClick={() => { onDrawerClose() }}
                                >
                                    {ta('favorito')}
                                </Link>
                                <Link
                                    href={'/my-account'}
                                    className="block p-3 hover:text-blue-400 hover:bg-blue-950"
                                    onClick={() => { onDrawerClose() }}
                                >
                                    {ta('mi_cuenta')}
                                </Link>
                                {user.is_admin && (
                                    <Link
                                        href={'/admin'}
                                        className="block p-3 hover:text-blue-400 hover:bg-blue-950"
                                        onClick={() => { onDrawerClose() }}
                                    >
                                        {ta('administrar')}
                                    </Link>
                                )}
                                <button
                                    className="block p-3 hover:text-blue-400 hover:bg-blue-950  w-full"
                                    onClick={() => {
                                        signOut()
                                        router.push('/login');
                                        onDrawerClose()
                                    }}
                                >
                                    {ta('cerrar_sesion')}
                                </button>
                            </div>
                        ) : (
                            <div className=' hover:bg-blue-950 '>
                                <Link
                                    href={'/login'}
                                    className="block p-3 hover:text-blue-400 hover:bg-blue-950"
                                    onClick={() => { onDrawerClose() }}
                                >
                                    {t('inciar_sesion')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Drawer
