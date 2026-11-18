'use client'
import { useEffect } from 'react'
import { FaArrowRotateRight, FaHouse, FaTriangleExclamation } from 'react-icons/fa6'
import { ErrorScreen } from './components/error-screen'
import './globals.css'

interface GlobalErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

// Último recurso: falló el propio layout de [locale] (base de datos caída, error en la cabecera…).
// Reemplaza todo el documento, así que trae su <html>/<body> y no tiene acceso a las traducciones:
// los textos van en español e inglés.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html lang='es' className='text-white'>
            <body className='bg-neutral-900 min-h-screen flex flex-col font-sans'>
                <ErrorScreen
                    code='500'
                    icon={FaTriangleExclamation}
                    title='Algo salió mal · Something went wrong'
                    message='No pudimos cargar kyaaa. Inténtalo de nuevo en unos minutos. · We could not load kyaaa. Please try again in a few minutes.'
                    footnote={error.digest ? `Ref: ${error.digest}` : undefined}
                >
                    <button type='button' className='btn-primary w-full' onClick={() => { reset() }}>
                        <FaArrowRotateRight aria-hidden />
                        Reintentar · Retry
                    </button>
                    {/* Recarga completa y no <Link>: el router puede ser lo que falló. */}
                    <button type='button' className='btn-primary w-full' onClick={() => { window.location.href = '/' }}>
                        <FaHouse aria-hidden />
                        Inicio · Home
                    </button>
                </ErrorScreen>
            </body>
        </html>
    )
}
