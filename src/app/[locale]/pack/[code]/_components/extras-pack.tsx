'use client'
import { useAuth } from '@/src/providers/AuthContext';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react'
import { FaDownload, FaHeart, FaStar } from 'react-icons/fa'
import { DialogRegisterNow } from './dialog-register-now';
import API from '@/src/providers/api';
import { IResponse } from '@/src/app/types/response';
import Link from 'next/link';

// Un <a> no admite `disabled`: estos son los estilos `disabled:` de btn-primary aplicados a mano,
// y además se ignoran los clics mientras dura otra acción (descarga, like…).
const LINK_DISABLED = ' pointer-events-none cursor-not-allowed border-neutral-700 bg-neutral-950';
import { useToast } from '@/src/providers/toastProvider';
import { isAxiosError } from 'axios';

interface IExtraPackProps {
    code: string
    price: number
    pack_id: number
    user_like: boolean,
    user_favorite: boolean
    user_buy: boolean
    /** Pack gratuito: no hay nada que comprar. */
    free?: boolean
    /** URL de la imagen del modal "Registrate ahora!" (pack.register_image). */
    register_image?: string | null
}
export const ExtraPack = ({
    code,
    price,
    pack_id,
    user_like,
    user_favorite,
    user_buy,
    free = false,
    register_image
}: IExtraPackProps) => {
    const t = useTranslations('pack-info');
    const { user } = useAuth()
    const { showToast } = useToast()
    const [like, setLike] = useState(user_like)
    const [favorite, setFavorite] = useState(user_favorite)
    const [loading, setLoading] = useState(false)
    const [openDialogRegisterNow, setOpenDialogRegisterNow] = useState(false)

    // Descargar, comprar, guardar y me gusta requieren sesión: sin ella se abre el modal "Registrate ahora!".
    const requireLogin = (action: () => void) => {
        if (user !== null) {
            action()
        } else {
            setOpenDialogRegisterNow(true)
        }
    }

    // La API decide qué ZIP le toca al usuario (completo o gratis + registrados) y devuelve una URL
    // firmada de corta duración; el navegador lo descarga directamente de S3.
    const handleDownload = async () => {
        try {
            setLoading(true)
            const { data } = await API.get<IResponse<{ url: string }>>('/api/pack/download', { params: { code } });
            if (data.success) {
                window.location.href = data.data.url
            }
        } catch (error) {
            console.error('Error durante la descarga:', error);
            const notAvailable = isAxiosError(error) && error.response?.status === 404
            showToast(t(notAvailable ? 'extra-pack.toast.descarga_no_disponible' : 'extra-pack.toast.error'), 'danger')
        } finally {
            setLoading(false)
        }
    };

    const fetchChangeLike = async (pack_id: number) => {
        try {
            const { data } = await API.post<IResponse<boolean>>('/api/like-pack', { pack_id });
            if (data.success) {
                setLike(data.data)
                showToast(t(data.data ? 'extra-pack.toast.like_agregado' : 'extra-pack.toast.like_quitado'))
            }
        } catch (error) {
            console.error('Error fetching protected data:', error);
            showToast(t('extra-pack.toast.error'), 'danger')
        } finally {
        }
    };

    const fetchChangeFavorite = async (pack_id: number) => {
        try {
            const { data } = await API.post<IResponse<boolean>>('/api/favorite-pack', { pack_id });
            if (data.success) {
                setFavorite(data.data)
                showToast(t(data.data ? 'extra-pack.toast.guardado_agregado' : 'extra-pack.toast.guardado_quitado'))
            }
        } catch (error) {
            console.error('Error fetching protected data:', error);
            showToast(t('extra-pack.toast.error'), 'danger')
        } finally {
        }
    };

    // Tamaños y fuente salen de btn-primary / btn-primary-icon (globals.css): 44px de alto, texto 14px.
    return (
        <div>
            <div className="">
                <div className="flex justify-between gap-2">
                    <button className="btn-primary"
                        disabled={loading}
                        onClick={() => {
                            requireLogin(handleDownload)
                        }}
                    >
                        <div className="px-2">
                            {t('extra-pack.descarga')}
                        </div>
                        <FaDownload
                            className='text-xl text-white'
                        />
                    </button>
                    <div className="col-start-1 row-start-1 flex items-start justify-end gap-1">
                        <button
                            className="btn-primary-icon rounded-full"
                            onClick={() => {
                                requireLogin(() => fetchChangeFavorite(pack_id))
                            }}
                        >
                            <FaStar
                                className={'text-xl ' + (favorite === true ? ' text-yellow-400' : 'text-white')}
                            />
                        </button>
                        <button
                            className="btn-primary-icon rounded-full"
                            onClick={() => {
                                requireLogin(() => fetchChangeLike(pack_id))
                            }}
                        >
                            <FaHeart
                                className={'text-xl ' + (like === true ? ' text-red-600' : 'text-white')}
                            />
                        </button>
                    </div>
                </div>
            </div>
            {
                user_buy ? (
                    <div className='py-2'>
                        <Link
                            href='/my-purchases'
                            className={'btn-primary w-full' + (loading ? LINK_DISABLED : '')}
                            aria-disabled={loading}
                            onClick={(e) => { if (loading) e.preventDefault() }}
                        >
                            {t('extra-pack.ver_compras')}
                        </Link>
                    </div>
                ) : free ? null : (
                    <div className='py-2'>
                        {user === null ? (
                            // Sin sesión no hay navegación: un botón (no un enlace a /buy) que abre el modal
                            // "¡Regístrate ahora!". Con un <Link> la barra de carga arrancaba al hacer clic
                            // (escucha los clics en <a> antes de que se cancele la navegación) y no paraba.
                            <button
                                type='button'
                                className='btn-primary w-full'
                                disabled={loading}
                                onClick={() => { setOpenDialogRegisterNow(true) }}
                            >
                                {t('extra-pack.comprar')} ${price}
                            </button>
                        ) : (
                            <Link
                                href={`/buy/${code}`}
                                className={'btn-primary w-full' + (loading ? LINK_DISABLED : '')}
                                aria-disabled={loading}
                                onClick={(e) => { if (loading) e.preventDefault() }}
                            >
                                {t('extra-pack.comprar')} ${price}
                            </Link>
                        )}
                    </div>
                )
            }

            <DialogRegisterNow
                open={openDialogRegisterNow}
                image={register_image}
                onClose={(open) => {
                    setOpenDialogRegisterNow(open)
                }}
            ></DialogRegisterNow>
        </div>
    )
}
