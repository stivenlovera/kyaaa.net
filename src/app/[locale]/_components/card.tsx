'use client'
import { useAuth } from "@/src/providers/AuthContext"
import { RetryImage } from "@/src/app/components/retry-image";
import Link from "next/link"
import { FaBookmark, FaHeart, FaStar } from "react-icons/fa6"
import { IResponse } from "../../types/response"
import { INewPacksAuth } from "../../types/pack.types"
import API from "@/src/providers/api"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { useToast } from "@/src/providers/toastProvider"
interface ICard {
    pack: INewPacksAuth
    urlImage: string
    /** Se llama cuando la API confirma el cambio de favorito (p. ej. para quitar la tarjeta en /favorites). */
    onFavoriteChange?: (favorite: boolean) => void
}
export const Card = ({
    pack,
    urlImage,
    onFavoriteChange
}: ICard) => {
    const { user } = useAuth()
    const t = useTranslations('pack-info')
    const { showToast } = useToast()
    const [like, setLike] = useState<boolean>(pack.like)
    const [favorite, setFavorite] = useState<boolean>(pack.favorite)
    const [buy, setBuy] = useState<boolean>(pack.buy)
    const series = pack.pack_serie.map((s) => s.serie.name).join(', ')
    const characters = pack.pack_character.map((c) => c.character.name).join(', ')

    const fetchChangeLike = async (pack_id: number) => {
        try {
            const { data } = await API.post<IResponse<boolean>>('/api/like-pack', { pack_id });
            if (data.success) {
                setLike(data.data)
                showToast(t(data.data ? 'extra-pack.toast.like_agregado' : 'extra-pack.toast.like_quitado'))
            } else {
                showToast(t('extra-pack.toast.error'), 'danger')
            }
        } catch (error) {
            console.error('Error fetching protected data:', error);
            showToast(t('extra-pack.toast.error'), 'danger')
        }
    };

    const fetchChangeFavorite = async (pack_id: number) => {
        try {
            const { data } = await API.post<IResponse<boolean>>('/api/favorite-pack', { pack_id });
            if (data.success) {
                setFavorite(data.data)
                onFavoriteChange?.(data.data)
                showToast(t(data.data ? 'extra-pack.toast.guardado_agregado' : 'extra-pack.toast.guardado_quitado'))
            } else {
                showToast(t('extra-pack.toast.error'), 'danger')
            }
        } catch (error) {
            console.error('Error fetching protected data:', error);
            showToast(t('extra-pack.toast.error'), 'danger')
        }
    };

    return (<div className="border-slate-900 border-2">
        <Link
            className="items-start justify-center"
            href={`/pack/${pack.code}`}
        >
            <div className="grid place-items-end">
                {urlImage ? (
                    <RetryImage
                        width={400}
                        height={500}
                        alt={`Preview ${pack.name}`}
                        fetchPriority="high"
                        className="w-full col-start-1 row-start-1"
                        unoptimized
                        priority
                        src={urlImage}
                    />
                ) : (
                    // Sin portada visible para este usuario (ver utils/pack-portada.ts).
                    <div className="w-full aspect-[4/5] col-start-1 row-start-1 bg-neutral-900" />
                )}
                {user !== null ? (
                    <div className="col-start-1 row-start-1 flex items-start justify-end gap-1 p-1">
                        {
                            buy ? (
                                <button
                                    className="p-1.5 border rounded-full bg-neutral-950/60 border-neutral-600 cursor-pointer"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        event.preventDefault();
                                        showToast(t('extra-pack.toast.comprado'), 'info')
                                    }}
                                >
                                    <FaBookmark
                                        className={'text-base ' + (buy === true ? ' text-blue-600' : 'text-white')}
                                    />
                                </button>
                            ) : (<></>)
                        }
                        <button
                            className="p-1.5 border rounded-full bg-neutral-950/60 border-neutral-600 cursor-pointer"
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                fetchChangeFavorite(pack.pack_id);
                            }}
                        >
                            <FaStar
                                className={'text-base ' + (favorite === true ? ' text-yellow-400' : 'text-white')}
                            />
                        </button>
                        <button
                            className="p-1.5 border rounded-full bg-neutral-950/60 border-neutral-600 cursor-pointer"
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                fetchChangeLike(pack.pack_id);
                            }}
                        >
                            <FaHeart
                                className={'text-base ' + (like === true ? ' text-red-600' : 'text-white')}
                            />
                        </button>
                    </div>
                ) : (<></>)}
            </div>

            <div className=''>
                <div className='flex flex-col basis-full bg-gray-800 p-1'>
                    <div className='line-clamp-2 hover:line-clamp-none text-sm'>
                        {pack.name.toLocaleLowerCase()}
                    </div>
                    <div className='truncate text-xs text-neutral-400'>
                        {t('serie')}: {series || '-'}
                    </div>
                    <div className='truncate text-xs text-neutral-400'>
                        {t('personaje')}: {characters || '-'}
                    </div>
                </div>
            </div>
        </Link>
    </div>)
}