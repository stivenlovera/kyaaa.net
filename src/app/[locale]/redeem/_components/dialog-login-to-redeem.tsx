'use client'
import { useTranslations } from 'next-intl'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { LoginLink } from '@/src/app/components/login-link'

interface DialogLoginToRedeemProps {
    open: boolean
    onClose: () => void
}

// Se abre al pulsar "Canjear" sin sesión. Mismo diseño que "Inicia sesión para votar"; los botones
// vuelven a /redeem con el código (la URL ya lleva ?code= cuando se abre el modal).
export const DialogLoginToRedeem = ({ open, onClose }: DialogLoginToRedeemProps) => {
    const t = useTranslations('canjear.dialogo')
    return (
        <Dialog isOpen={open} onClose={onClose} title={t('titulo')}>
            <div className='grid grid-cols-1 gap-4'>
                <p>{t('mensaje')}</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <LoginLink className='btn-primary w-full font-bold'>{t('inicia_sesion')}</LoginLink>
                    <LoginLink className='btn-primary w-full' register>{t('crear_cuenta')}</LoginLink>
                </div>
                <button className='btn-primary w-full text-red-500' type='button' onClick={onClose}>
                    {t('cerrar')}
                </button>
            </div>
        </Dialog>
    )
}
