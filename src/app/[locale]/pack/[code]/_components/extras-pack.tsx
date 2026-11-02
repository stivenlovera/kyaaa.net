'use client'
import { useAuth } from '@/src/providers/AuthContext';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react'
import { FaBookmark, FaDownload, FaHeart } from 'react-icons/fa'
import { DialogRegisterNow } from './dialog-register-now';
import API from '@/src/providers/api';
import { IResponse } from '@/src/app/types/response';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
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

    return (
        <div>
            <div className="">
                <div className="flex justify-between gap-2">
                    <button className="btn-primary font-bold"
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
                            className="btn-primary p-3 border rounded-full border-neutral-600 cursor-pointer"
                            onClick={() => {
                                requireLogin(() => fetchChangeFavorite(pack_id))
                            }}
                        >
                            <FaBookmark
                                className={'text-xl ' + (favorite === true ? ' text-yellow-400' : 'text-white')}
                            />
                        </button>
                        <button
                            className="btn-primary p-3 border rounded-full border-neutral-600 cursor-pointer"
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
                        <button
                            className='btn-primary w-full font-bold'
                            disabled={loading}
                            onClick={() => {
                                if (user !== null) {
                                    router.push('/my-purchases');
                                }
                            }}
                        >
                            {t('extra-pack.ver_compras')}
                        </button>
                    </div>
                ) : free ? null : (
                    <div className='py-2'>
                        <button
                            className='btn-primary w-full font-bold'
                            disabled={loading}
                            onClick={() => {
                                requireLogin(() => router.push(`/buy/${code}`))
                            }}
                        >
                            {t('extra-pack.comprar')} ${price}
                        </button>
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
