'use client'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { PaginationView } from './view-image'
import { View } from './view'
import { IPagePack } from '@/src/app/types/page.types'
import { usePathname, useSearchParams } from 'next/navigation'
import { preload, } from 'react-dom';
import { useTranslations } from 'next-intl'
import { useAuth } from '@/src/providers/AuthContext'
import { DialogRegisterNow } from './dialog-register-now'

interface PreviewPageProps {
    code: string
    currentPage: string
    pack: IPagePack
    /** Imagen del modal "¡Regístrate ahora!" (pack.register_image); solo llega para anónimos. */
    registerImage?: string | null
}
export interface ImagesProps {
    num: string
    img: string
}

export const ViewPage = ({ code, currentPage, pack, registerImage }: PreviewPageProps) => {
    const t = useTranslations('pack-info');
    const { user } = useAuth()
    const [openDialogRegisterNow, setOpenDialogRegisterNow] = useState(false)
    const searchParams = useSearchParams()
    const historyStack = useRef<string[]>([]);
    const numPage = searchParams.get('page') ?? currentPage
    // Solo las páginas que el usuario puede ver: los números pueden tener saltos (1, 2, 4, 5…),
    // por eso se navega por posición en la lista y no sumando o restando al número.
    const images: ImagesProps[] = pack.pages.map((p) => {
        const img: ImagesProps = {
            num: p.num,
            img: p.url
        }
        return img
    })
    const index = Math.max(0, images.findIndex((p) => p.num === numPage))
    const position = index + 1
    const [urlImage, setUrlImage] = useState<string>(images[index].img)
    const pathname = usePathname();
    const locked = pack.total - images.length

    const goTo = (target: number) => {
        const next = images[Math.min(Math.max(target, 0), images.length - 1)]
        window.history.replaceState(null, '', `${pathname}?page=${next.num}`);
        setUrlImage(next.img)
    }

    const updateQueryParam = ({
        init = false,
        finish = false,
        next = false,
        preview = false,
        page = numPage
    }: { init?: boolean, finish?: boolean, next?: boolean, preview?: boolean, page?: string }) => {
        if (init) return goTo(0)
        if (finish) return goTo(images.length - 1)
        if (next) return goTo(index + 1)
        if (preview) return goTo(index - 1)
        goTo(images.findIndex((p) => p.num === page))
    };

    useEffect(() => {
        // Precarga las imágenes vecinas.
        const preview: number = 5;
        images.slice(Math.max(0, index - (preview - 1)), index + preview).forEach((i) => {
            preload(i.img, { as: 'image' })
        })
        if (historyStack.current.length > 1 && historyStack.current[historyStack.current.length - 2] === pathname) {
            // Remove the last item to sync the tracking stack
            historyStack.current.pop();
        } else {
            // User is moving forward, push the route to our stack
            historyStack.current.push(pathname);
        }
    }, [numPage])


    return (
        <div className="bg-neutral-900 grid grid-cols-1 text-sm">
            <div className="grid">
                <div className='flex mx-auto flex-wrap items-center justify-center pt-1'>
                    <Link href={`/pack/${code}`} className='flex items-center justify-center hover:bg-gray-800 rounded-full'>
                        Volver a la galeria
                    </Link>
                </div>
                <PaginationView
                    pages={images}
                    allPages={images.length}
                    page={position}
                    code={code}
                    clickLeftFirst={() => updateQueryParam({ init: true })}
                    clickLeftSecond={() => updateQueryParam({ preview: true })}
                    clickRightFirst={() => updateQueryParam({ next: true })}
                    clickRightSecond={() => updateQueryParam({ finish: true })}
                    changePage={(value) => updateQueryParam({ page: value })}
                />
                <View
                    image={urlImage!}
                    numPage={position}
                    allPage={images.length}
                    clickNext={() => updateQueryParam({ next: true })}
                    clickPreview={() => updateQueryParam({ preview: true })}
                />
                <PaginationView
                    pages={images}
                    allPages={images.length}
                    page={position}
                    code={code}
                    clickLeftFirst={() => updateQueryParam({ init: true })}
                    clickLeftSecond={() => updateQueryParam({ preview: true })}
                    clickRightFirst={() => updateQueryParam({ next: true })}
                    clickRightSecond={() => updateQueryParam({ finish: true })}
                    changePage={(page) => updateQueryParam({ page: page })}
                />
                {locked > 0 && !pack.full_access && (
                    <div className='flex mx-auto flex-wrap items-center justify-center gap-2 py-2 text-center'>
                        <span>{t('paginas_bloqueadas', { count: locked })}</span>
                        {user === null ? (
                            // Sin sesión no se puede comprar (/buy exige login): como en la ficha del pack
                            // (extras-pack.tsx), un botón que abre el modal "¡Regístrate ahora!" en vez de un enlace.
                            <button
                                type='button'
                                className='rounded-full bg-gray-800 px-3 py-1 hover:bg-gray-700 cursor-pointer'
                                onClick={() => { setOpenDialogRegisterNow(true) }}
                            >
                                {t('extra-pack.comprar')}
                            </button>
                        ) : (
                            <Link href={`/buy/${code}`} className='rounded-full bg-gray-800 px-3 py-1 hover:bg-gray-700'>
                                {t('extra-pack.comprar')}
                            </Link>
                        )}
                    </div>
                )}
            </div>
            <DialogRegisterNow
                open={openDialogRegisterNow}
                image={registerImage}
                onClose={(open) => { setOpenDialogRegisterNow(open) }}
            />
        </div>
    )
}
