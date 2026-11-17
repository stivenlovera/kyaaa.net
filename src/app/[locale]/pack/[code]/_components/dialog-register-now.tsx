import Dialog from '@/src/app/[locale]/_components/dialog'
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { LoginLink } from '@/src/app/components/login-link';

interface DialogRegisterNowProps {
    open: boolean;
    onClose: (open: boolean) => void;
    /** Imagen propia del pack (pack.register_image); si no hay, el modal va sin imagen. */
    image?: string | null;
}

// Se abre al descargar, comprar, guardar o dar me gusta sin sesión. Mismo diseño que el modal
// "Inicia sesión para votar" de /participate: mensaje, botones de iniciar sesión / crear cuenta
// (vuelven a esta página tras entrar) y cerrar.
export const DialogRegisterNow = ({ open, onClose, image }: DialogRegisterNowProps) => {
    const t = useTranslations('pack-info.extra-pack.dialogo_descargar');
    return (
        <Dialog
            isOpen={open}
            onClose={(() => { onClose(false) })}
            title={t('titulo')}
        >
            <div className='grid grid-cols-1 gap-4'>
                {image && (
                    <Image
                        className='w-full h-auto rounded-md'
                        src={image}
                        alt=''
                        width={400}
                        height={500}
                        unoptimized
                    />
                )}
                <p>{t('mensaje')}</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <LoginLink className='btn-primary w-full font-bold'>{t('inicia_sesion')}</LoginLink>
                    <LoginLink className='btn-primary w-full' register>{t('crear_cuenta')}</LoginLink>
                </div>
                <button className='btn-primary w-full text-red-500' type='button' onClick={() => { onClose(false) }}>
                    {t('cerrar')}
                </button>
            </div>
        </Dialog>
    )
}
