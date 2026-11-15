'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Dialog from '@/src/app/[locale]/_components/dialog'

interface DialogLoginToVoteProps {
    open: boolean
    onClose: () => void
    /** anonymous: pide iniciar sesión; unverified: pide verificar el correo. */
    reason: 'anonymous' | 'unverified'
}

// Se abre al pulsar "Votar" sin poder votar: sin sesión, o con sesión pero el correo sin verificar.
export const DialogLoginToVote = ({ open, onClose, reason }: DialogLoginToVoteProps) => {
    const t = useTranslations('participa')
    const anonymous = reason === 'anonymous'

    return (
        <Dialog isOpen={open} onClose={onClose} title={anonymous ? t('login_titulo') : t('verificar_titulo')}>
            <div className='grid grid-cols-1 gap-4'>
                <p>{anonymous ? t('login_mensaje') : t('verificar_mensaje')}</p>
                {anonymous ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <Link className='btn-primary w-full font-bold' href='/login'>{t('iniciar_sesion')}</Link>
                        <Link className='btn-primary w-full' href='/register'>{t('crear_cuenta')}</Link>
                    </div>
                ) : (
                    <Link className='btn-primary w-full font-bold' href='/my-account'>{t('ir_mi_cuenta')}</Link>
                )}
                <button className='btn-primary w-full text-red-500' type='button' onClick={onClose}>
                    {t('cerrar')}
                </button>
            </div>
        </Dialog>
    )
}
