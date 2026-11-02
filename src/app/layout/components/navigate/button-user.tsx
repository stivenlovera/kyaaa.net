import { IAuth } from '@/src/app/types/user.type'
import { useAuth } from '@/src/providers/AuthContext'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { FaAngleDown, FaAngleUp } from 'react-icons/fa'

interface ButtonUserProps {
    user: IAuth
}

const ButtonUser = ({ user }: ButtonUserProps) => {
    const t = useTranslations('header.menu.auth')
    const [openMenu, setOpenMenu] = useState(false)
    const router = useRouter();
    const { signOut } = useAuth()

    return (
        <div className='flex flex-row gap-2'>
            <div className="relative inline-block text-left"
            >
                <button
                    id="dropdown-button"
                    className="btn-primary "
                    onClick={() => { setOpenMenu(true) }}
                >
                    <div className='flex flex-row gap-2'>
                        <img
                            src={user.image!.toString()}
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
                            onClick={() => {
                                signOut()
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
