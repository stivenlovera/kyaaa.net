import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FaCompass, FaFlag, FaHouse } from 'react-icons/fa6'
import { ErrorScreen } from '@/src/app/components/error-screen'

// 404 dentro del layout (con cabecera y pie): rutas que no existen (ver [...rest]/page.tsx) y
// notFound() de las páginas (pack, serie, personaje… inexistentes).
export default async function NotFound() {
    const t = await getTranslations('errores')
    return (
        <>
        {/* React 19 sube el <title> al <head>; not-found no admite generateMetadata. */}
        <title>{`${t('not_found.titulo')} | kyaaa`}</title>
        <ErrorScreen
            code='404'
            icon={FaCompass}
            title={t('not_found.titulo')}
            message={t('not_found.mensaje')}
            footnote={
                <Link href='/support?category=otro' className='inline-flex items-center gap-1 hover:text-white hover:underline'>
                    <FaFlag aria-hidden />
                    {t('reportar')}
                </Link>
            }
        >
            <Link href='/' className='btn-primary w-full'>
                <FaHouse aria-hidden />
                {t('inicio')}
            </Link>
            <Link href='/serie' className='btn-primary w-full'>
                <FaCompass aria-hidden />
                {t('explorar')}
            </Link>
        </ErrorScreen>
        </>
    )
}
