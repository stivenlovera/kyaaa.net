'use client'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { FaCheck } from 'react-icons/fa6'
import Dialog from '../../../_components/dialog'
import { routing } from '@/src/i18n/routing'
import { useRouter } from '@/src/app/layout/components/navigate/use-loading-router'

interface DialogThanksProps {
    open: boolean;
    /** Código del pack comprado: al continuar se va a /pack/<code>. */
    code: string;
    /** Imagen propia del pack (pack.thanks_image); si no hay, el modal va sin imagen. */
    image?: string | null;
}

const VENTAJAS = ['ventaja_completo', 'ventaja_sin_censura', 'ventaja_descarga', 'ventaja_mis_compras'] as const

// Se abre tras capturar el pago. Al continuar (o cerrar) se reemplaza /buy/<code> por /pack/<code>:
// así "atrás" no vuelve a la página de pago y no se compra el pack dos veces por error.
export const DialogThanks = ({ open, code, image }: DialogThanksProps) => {
    const t = useTranslations('buy.gracias')
    const locale = useLocale()
    const router = useRouter()
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
    const goToPack = () => { router.replace(`${prefix}/pack/${code}`) }

    return (
        <Dialog isOpen={open} onClose={goToPack} title={t('titulo')}>
            <div className='grid grid-cols-1 gap-4'>
                {image && (
                    <Image
                        fetchPriority='high'
                        src={image}
                        alt=''
                        width={400}
                        height={500}
                        unoptimized
                        className='w-full h-auto rounded-md'
                    />
                )}
                <p>{t('mensaje')}</p>
                <ul className='grid gap-2'>
                    {VENTAJAS.map((key) => (
                        <li key={key} className='flex items-start gap-2'>
                            <FaCheck className='shrink-0 mt-0.5 text-green-500' />
                            <span>{t(key)}</span>
                        </li>
                    ))}
                </ul>
                <button className='btn-primary w-full' type='button' onClick={goToPack}>
                    {t('ver_pack')}
                </button>
            </div>
        </Dialog>
    )
}
