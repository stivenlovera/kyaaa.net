'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FaImage, FaImages } from 'react-icons/fa6'
import { RetryImage } from '@/src/app/components/retry-image'
import { IParticipatePackCard } from '@/src/app/types/participate.types'
import { DialogPosterCarousel } from './dialog-poster-carousel'

interface ParticipateCardProps {
    pack: IParticipatePackCard
    /** Resaltar la tarjeta (el pack que votó el usuario). */
    highlighted?: boolean
    /** Contenido bajo los datos del pack: porcentaje de votos y botón de votar. */
    children?: React.ReactNode
}

// Tarjeta apaisada de un pack en votación: imagen a la izquierda y datos, votos y botón a la derecha.
// El pack está en borrador (aún no publicado): no tiene favorito ni me gusta y no enlaza a
// /pack/<code>; al pulsar la imagen se abre un carrusel con sus pósters.
export const ParticipateCard = ({ pack, highlighted = false, children }: ParticipateCardProps) => {
    const t = useTranslations('participa')
    const [open, setOpen] = useState(false)
    const series = pack.pack_serie.map((s) => s.serie.name).join(', ')
    const characters = pack.pack_character.map((c) => c.character.name).join(', ')
    const hasPosters = pack.posters.length > 0

    return (
        <div className={`flex border-2 rounded overflow-hidden ${highlighted ? 'border-green-700 bg-green-950/40' : 'border-slate-900 bg-gray-800'}`}>
            <button
                type='button'
                className='relative shrink-0 w-28 sm:w-36 grid disabled:cursor-default'
                onClick={() => { setOpen(true) }}
                disabled={!hasPosters}
                aria-label={hasPosters ? t('ver_imagenes', { name: pack.name }) : undefined}
            >
                {pack.portada.url ? (
                    <RetryImage
                        width={400}
                        height={500}
                        alt={`Preview ${pack.name}`}
                        className='w-full h-full object-cover col-start-1 row-start-1'
                        unoptimized
                        src={pack.portada.url}
                    />
                ) : (
                    // Sin portada ni pósters: hueco con icono en lugar de un bloque negro.
                    <div className='w-full h-full min-h-36 aspect-4/5 col-start-1 row-start-1 flex flex-col items-center justify-center gap-1 bg-neutral-900 text-neutral-600'>
                        <FaImage className='text-3xl' />
                        <span className='text-xs'>{t('sin_imagen')}</span>
                    </div>
                )}
                {hasPosters && (
                    <span className='absolute top-1 left-1 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-950/70 border border-neutral-600'>
                        <FaImages /> {pack.posters.length}
                    </span>
                )}
            </button>
            <div className='flex flex-col flex-1 min-w-0 gap-1 p-2'>
                <div className='line-clamp-2 font-bold'>
                    {pack.name.toLocaleLowerCase()}
                </div>
                <div className='truncate text-xs text-neutral-400'>
                    {t('serie')}: {series || '-'}
                </div>
                <div className='truncate text-xs text-neutral-400'>
                    {t('personajes')}: {characters || '-'}
                </div>
                {children !== undefined && <div className='mt-auto pt-1 flex flex-col gap-1'>{children}</div>}
            </div>
            {hasPosters && (
                <DialogPosterCarousel
                    open={open}
                    onClose={() => { setOpen(false) }}
                    title={pack.name}
                    images={pack.posters}
                />
            )}
        </div>
    )
}
