'use client'
import { useAuth } from "@/src/providers/AuthContext"
import Image from "next/image"
import Link from "next/link"
import { FaBookmark, FaCartArrowDown, FaHeart } from "react-icons/fa6"
import { IResponse } from "../../types/response"
import { INewPacksAuth } from "../../types/pack.types"
import API from "@/src/providers/api"
import { useState } from "react"
interface ICard {
    pack: INewPacksAuth
    urlImage: string
}
export const Card = ({
    pack,
    urlImage
}: ICard) => {
    const { user } = useAuth()
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
            }
        } catch (error) {
            console.error('Error fetching protected data:', error);
        } finally {
        }
    };

    const fetchChangeFavorite = async (pack_id: number) => {
        try {
            const { data } = await API.post<IResponse<boolean>>('/api/favorite-pack', { pack_id });
            if (data.success) {
                setFavorite(data.data)
            }
        } catch (error) {
            console.error('Error fetching protected data:', error);
        } finally {
        }
    };

    return (<div className="border-slate-900 border-2">
        <Link
            className="items-start justify-center"
            href={`/pack/${pack.code}`}
        >
            <div className="grid place-items-end">
                {urlImage ? (
                    <Image
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
                                    className="p-2 border rounded-full bg-neutral-950/60 border-neutral-600 disabled:bg-neutral-950/80"
                                    disabled={true}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        event.preventDefault();
                                        //onBuy(pack_id);
                                    }}
                                >
                                    <FaCartArrowDown
                                        className={'text-xl ' + (buy === true ? ' text-blue-600' : 'text-white')}
                                    />
                                </button>
                            ) : (<></>)
                        }
                        <button
                            className="p-2 border rounded-full bg-neutral-950/60 border-neutral-600 cursor-pointer"
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                fetchChangeFavorite(pack.pack_id);
                            }}
                        >
                            <FaBookmark
                                className={'text-xl ' + (favorite === true ? ' text-yellow-400' : 'text-white')}
                            />
                        </button>
                        <button
                            className="p-2 border rounded-full bg-neutral-950/60 border-neutral-600 cursor-pointer"
                            onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                fetchChangeLike(pack.pack_id);
                            }}
                        >
                            <FaHeart
                                className={'text-xl ' + (like === true ? ' text-red-600' : 'text-white')}
                            />
                        </button>
                    </div>
                ) : (<></>)}
            </div>

            <div className=''>
                <div className='flex flex-col basis-full bg-gray-800 p-1'>
                    <div className='line-clamp-2 hover:line-clamp-none sm:text-10 xl:text-12'>
                        {pack.name.toLocaleLowerCase()}
                    </div>
                    <div className='truncate text-xs text-neutral-400'>
                        Serie: {series || '-'}
                    </div>
                    <div className='truncate text-xs text-neutral-400'>
                        Personajes: {characters || '-'}
                    </div>
                </div>
            </div>
        </Link>
    </div>)
}