'use client'
import { IPage } from '@/src/app/types/page.types'
import { divideInBLocks } from '@/src/app/utils/other'
import { RetryImage } from "@/src/app/components/retry-image";
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { FaAngleDown } from 'react-icons/fa'
interface IMore {
    pages: IPage[]
    code: string
    saltos: number
}
export const More = ({ pages, code, saltos }: IMore) => {
    const [more, setMore] = useState<number>(0)
    const [paginas, setPaginas] = useState<IPage[]>([])
    const grupos = divideInBLocks(pages, saltos)
    useEffect(() => {
    }, [more])

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
            {
                paginas.map((image, i) => {
                    const imagePage = image.url
                    return (
                        <div
                            className="flex p-1 sm:p-1 md:p-1 lg:p-2 xl:p-2 justify-center w-full"
                            key={i}
                        >
                            <Link
                                href={`/pack/${code}?page=${image.num}`}
                                className=""
                            >
                                <RetryImage
                                    fetchPriority="high"
                                    src={imagePage}
                                    alt={`pagina ${image.num}`}
                                    width={270}
                                    height={347}
                                    unoptimized
                                    priority
                                />
                            </Link>
                        </div>
                    )
                })
            }
            <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-4 xl:col-span-5" >
                {
                    (pages.length - 1) > paginas.length ? (
                        <div className="py-2">
                            <button
                                className='btn-primary w-full font-bold flex justify-center'
                                onClick={() => {
                                    grupos.map((grupo, i) => {
                                        if (i === more) {
                                            grupo.map((img) => {
                                                paginas.push(img)
                                                setPaginas(paginas)
                                            })
                                        }
                                    })
                                    setMore(more + 1)
                                }}
                            >
                                Ver mas <FaAngleDown className='text-2xl mx-1' />
                            </button>
                        </div>
                    ) : (<></>)
                }
            </div>
        </div>
    )
}
