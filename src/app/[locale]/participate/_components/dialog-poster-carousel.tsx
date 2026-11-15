'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import Dialog from '@/src/app/[locale]/_components/dialog'

interface DialogPosterCarouselProps {
    open: boolean
    onClose: () => void
    title: string
    /** URLs de las imágenes, en orden. */
    images: string[]
}

// Carrusel de los pósters de un pack: flechas (también con el teclado ←/→), puntos para saltar a una
// imagen y deslizar el dedo en móvil.
export const DialogPosterCarousel = ({ open, onClose, title, images }: DialogPosterCarouselProps) => {
    const t = useTranslations('participa')
    const [index, setIndex] = useState(0)
    const [touchX, setTouchX] = useState<number | null>(null)
    const total = images.length
    const multiple = total > 1

    const go = (next: number) => { setIndex(((next % total) + total) % total) }

    // Teclado: ←/→ cambian de imagen y Escape cierra.
    useEffect(() => {
        if (!open) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') setIndex((i) => (i - 1 + total) % total)
            if (event.key === 'ArrowRight') setIndex((i) => (i + 1) % total)
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => { window.removeEventListener('keydown', onKey) }
    }, [open, total, onClose])

    const close = () => {
        setIndex(0)
        onClose()
    }

    return (
        <Dialog isOpen={open} onClose={close} title={title} panelClassName='w-full md:w-[32rem]'>
            <div className='grid grid-cols-1 gap-3'>
                <div
                    className='relative select-none'
                    onTouchStart={(e) => { setTouchX(e.touches[0].clientX) }}
                    onTouchEnd={(e) => {
                        if (touchX === null || !multiple) return
                        const delta = e.changedTouches[0].clientX - touchX
                        if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1))
                        setTouchX(null)
                    }}
                >
                    <Image
                        key={images[index]}
                        src={images[index]}
                        alt={t('imagen_n', { n: index + 1, total })}
                        width={800}
                        height={1000}
                        className='w-full h-auto max-h-[70vh] object-contain rounded bg-neutral-900'
                        unoptimized
                    />
                    {multiple && (<>
                        <button
                            type='button'
                            className='absolute left-1 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-950/70 border border-neutral-600'
                            onClick={() => { go(index - 1) }}
                            aria-label={t('anterior')}
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            type='button'
                            className='absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-950/70 border border-neutral-600'
                            onClick={() => { go(index + 1) }}
                            aria-label={t('siguiente')}
                        >
                            <FaChevronRight />
                        </button>
                    </>)}
                </div>
                {multiple && (
                    <div className='flex flex-wrap items-center justify-center gap-2'>
                        {images.map((src, i) => (
                            <button
                                key={src}
                                type='button'
                                className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-white' : 'bg-neutral-600'}`}
                                onClick={() => { setIndex(i) }}
                                aria-label={t('imagen_n', { n: i + 1, total })}
                                aria-current={i === index}
                            />
                        ))}
                    </div>
                )}
                <button className='btn-primary w-full' type='button' onClick={close}>
                    {t('cerrar')}
                </button>
            </div>
        </Dialog>
    )
}
