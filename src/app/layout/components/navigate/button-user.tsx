import { IAuth } from '@/src/app/types/user.type'
import { useAuth } from '@/src/providers/AuthContext'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from "@/src/app/layout/components/navigate/use-loading-router";
import React, { useState } from 'react'
import { FaAngleDown, FaAngleUp } from 'react-icons/fa'

interface ButtonUserProps {
    user: IAuth
    /** Solo la foto redonda, sin nick ni flecha (cabecera móvil). El desplegable es el mismo. */
    compact?: boolean
}

const ButtonUser = ({ user, compact = false }: ButtonUserProps) => {
    const t = useTranslations('header.menu.auth')
    const [openMenu, setOpenMenu] = useState(false)
    const router = useRouter();
    const { signOut } = useAuth()
    const avatar = user.image || '/img/default-profile.png'

    return (
        <div className='flex flex-row gap-2'>
            <div className={"relative text-left " + (compact ? "block" : "inline-block")}
            >
                {compact ? (
                    <button
                        className="block rounded-full border-2 border-neutral-600 hover:border-neutral-400 p-0.5 cursor-pointer"
                        aria-label={t('mi_cuenta')}
                        aria-expanded={openMenu}
                        onClick={() => { setOpenMenu(true) }}
                    >
                        <img
                            src={avatar}
                            alt="Perfil"
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    </button>
                ) : (
                    <button
                        id="dropdown-button"
                        className="btn-primary "
                        onClick={() => { setOpenMenu(true) }}
                    >
                        <div className='flex flex-row gap-2'>
                            <img
                                src={avatar}
                                alt="Perfil"
                                className="w-6 h-6 rounded-full object-cover"
                            ></img>
                            <p className='px-1'>{user.nick}</p>
                        </div>
                        {openMenu ? (
                            <FaAngleUp
                                color='white'
                                size={25}
                            />
                        ) : (
                            <FaAngleDown
                                color='white'
                                size={25}
                            />
                        )}

                    </button>
                )}
                {openMenu ? (
                    <div
                        className='fixed inset-0 w-screen h-screen'
                        onClick={() => {
                            setOpenMenu(false)
                        }} >
                    </div>) : null}

                <div id="dropdown-menu"
                    className={!openMenu ? ` hidden ` : `  ` + ` origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none`}
                    onClick={() => {
                        setOpenMenu(false)
                    }}
                >

                    <div className="py-1">
                        <Link
                            href={'/my-purchases'}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            {t('mis_compra')}
                        </Link>
                        <Link
                            href={'/favorites'}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            {t('favorito')}
                        </Link>
                        <Link
                            href={'/my-tickets'}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            {t('mis_tickets')}
                        </Link>
                        <Link
                            href={'/my-account'}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            {t('mi_cuenta')}
                        </Link>
                        {user.is_admin && (
                            <Link
                                href={'/admin'}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {t('administrar')}
                            </Link>
                        )}
                        <button
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left cursor-pointer"
                            onClick={async () => {
                                await signOut()
                                router.push('/login');
                            }}
                        >
                            {t('cerrar_sesion')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ButtonUser;
