"use client";

import { Suspense, useEffect, useState } from 'react';
import { TopLoader } from './top-loader';
import Image from 'next/image';
import { FaAlignJustify } from "react-icons/fa";
import { ListMenu } from '../../layout.type';
import Drawer from './drawer';
import { useAuth } from '@/src/providers/AuthContext';
import ButtonUser from './button-user';
import { ButtonLogin } from './button-login';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/src/i18n/navigation';

export const Header = () => {
    const t = useTranslations('header.menu');
    const [openDrawer, setDrawer] = useState<boolean>(false)
    const pathname = usePathname()

    const { user } = useAuth()

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

    const selectedRoute = (url: string) => {

        const firstPathname = pathname.split("/")[1];
        if (firstPathname === url.replace(/[/]/g, "")) {
            return ` bg-neutral-700 `
        } else {
            return ``
        }
    }

    useEffect(() => {
    }, [user]);

    //console.log(menu)
    return (
        <nav className="sticky top-0 z-30 bg-neutral-800 md:px-10 xl:px-10 2xl:px-10" >
            <div className='flex justify-between'>
                <Link href={"/"} className='flex justify-start p-3'>
                    <Image
                        className=''
                        src="/img/logo_white.png"
                        alt="logo"
                        width={45}
                        height={40}
                        // Archivo estático pequeño: servirlo tal cual evita /_next/image, que solo se cachea 2 min.
                        unoptimized
                    />
                    <h5 className={`font-wild-words-roman self-center text-2xl font-bold px-2`} >ia.kyaaa</h5>
                </Link>
                <div className='justify-end space-x-2 py-3'>
                    {/*  <button
                        className="xl:hidden p-2 w-10 rounded-lg bg-grayl-300 hover:bg-grayl-400 dark:bg-grayl-700 dark:hover:bg-grayl-800"
                        onClick={() => setModeDark(!modeDark)}>
                        <FontAwesomeIcon
                            className='text-gray-900 dark:text-white text-xl '
                            icon={modeDark ? faMoon : faSun}
                            size='lg'
                        />
                    </button> */}

                    <div className={`hidden w-full xl:block lg:block md:block`}>
                        <ul className="font-medium flex space-x-2">
                            {
                                menu.map((menu, i) => {
                                    return (
                                        <li key={i}>
                                            <Link
                                                href={menu.url as Parameters<typeof Link>['0']['href']}
                                                className={"block p-2 hover:text-neutral-100 hover:bg-neutral-700" + selectedRoute(menu.url)}
                                            >
                                                {menu.name}
                                            </Link>
                                        </li>

                                    )
                                })
                            }
                            {
                                user ?
                                    (<li>
                                        <ButtonUser user={user} ></ButtonUser>
                                    </li>)
                                    :
                                    (<li>
                                        <ButtonLogin></ButtonLogin>
                                    </li>)
                            }
                        </ul>
                    </div>

                </div>
                {/* Móvil: la foto abre el menú de la cuenta (como en escritorio) y la hamburguesa, la navegación del sitio. */}
                <div className='md:hidden flex items-center gap-1'>
                    {user && <ButtonUser user={user} compact />}
                    <button
                        className='p-3 rounded-lg bg-grayl-300 hover:bg-grayl-400'
                        aria-label={t('abrir_menu')}
                        onClick={() => { setDrawer(true) }}
                    >
                        <FaAlignJustify size={30} color="white" />
                    </button>
                </div>
            </div>
            {/* <div className="xl:hidden font-medium flex space-x-4 p-2">
                <Search
                    texto={search}
                    value={setSearch}
                    onSubmit={enviar}
                />
            </div> */}
            {/* useSearchParams exige un límite de Suspense para no forzar el renderizado en cliente. */}
            <Suspense fallback={null}>
                <TopLoader />
            </Suspense>
            <Drawer
                openDrawer={openDrawer}
                onDrawerClose={() => { setDrawer(false); console.log('close Navigate') }}
                user={user!}
            ></Drawer>
        </nav >
    )
}
export default Header;
