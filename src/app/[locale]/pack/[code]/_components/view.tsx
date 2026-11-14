'use client'
//import {Link} from '@/i18n/routing';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import useWindowSize from "@rooks/use-window-size"
import { RetryImage } from "@/src/app/components/retry-image";

interface ViewProps {
    image: string
    numPage: number
    allPage: number
    clickNext: () => void
    clickPreview: () => void
}
export const View = ({ image, numPage, allPage, clickPreview, clickNext }: ViewProps) => {
    const router = useRouter();
    const { innerWidth, /* innerHeight, outerHeight, outerWidth */ } = useWindowSize()

    useEffect(() => {
    }, [innerWidth])

    const pageNext = numPage === allPage ? false : true;
    const pagePreview = numPage === 1 ? false : true;

    return (
        <div
            className="flex items-center justify-center w-full"
        >
            <button
                onClickCapture={(e) => {
                    if ((innerWidth! / 2) > e.clientX) {
                        if (pagePreview) {
                            clickPreview()
                        }

                    }
                    else {
                        if (pageNext) {
                            clickNext()
                        }
                    }
                }}>
                <RetryImage
                    width={1300}
                    height={1700}
                    fetchPriority="high"
                    className=''
                    alt={`pagina ${numberToString(numPage, allPage)}`}
                    unoptimized
                    priority
                    src={image}
                />
            </button>
        </div>
    )
}

export function numberToString(num: number, length: number): string {
    const logitud = length.toString().length;
    const cadena = String(num).padStart(logitud, '0');
    return cadena
}
