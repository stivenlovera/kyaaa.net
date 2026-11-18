'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FaArrowRotateRight, FaFlag, FaHouse, FaTriangleExclamation } from 'react-icons/fa6'
import { ErrorScreen } from '@/src/app/components/error-screen'

interface ErrorPageProps {
    error: Error & { digest?: string }
    reset: () => void
}

// Error inesperado al renderizar una página (dentro del layout: cabecera y pie siguen visibles).
// `digest` es el identificador que Next deja en el log del servidor: se muestra para poder citarlo en
// un ticket de soporte.
export default function ErrorPage({ error, reset }: ErrorPageProps) {
    const t = useTranslations('errores')

    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <>
        <title>{`${t('error.titulo')} | kyaaa`}</title>
        <ErrorScreen
            code='500'
            icon={FaTriangleExclamation}
            title={t('error.titulo')}
            message={t('error.mensaje')}
            footnote={
                <>
                    {error.digest && <span className='block pb-1'>{t('error.referencia', { digest: error.digest })}</span>}
                    <Link href='/support?category=otro' className='inline-flex items-center gap-1 hover:text-white hover:underline'>
                        <FaFlag aria-hidden />
                        {t('reportar')}
                    </Link>
                </>
            }
        >
            <button type='button' className='btn-primary w-full' onClick={() => { reset() }}>
                <FaArrowRotateRight aria-hidden />
                {t('error.reintentar')}
            </button>
            <Link href='/' className='btn-primary w-full'>
                <FaHouse aria-hidden />
                {t('inicio')}
            </Link>
        </ErrorScreen>
        </>
    )
}
