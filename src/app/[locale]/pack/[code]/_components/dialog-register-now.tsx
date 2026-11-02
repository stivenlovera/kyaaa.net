import Dialog from '@/src/app/[locale]/_components/dialog'
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
interface DialogChangeEmailProps {
    open: boolean;
    onClose: (open: boolean) => void;
    /** Imagen propia del pack (pack.register_image); si no hay, el modal va sin imagen. */
    image?: string | null;
}
export const DialogRegisterNow = ({ open, onClose, image }: DialogChangeEmailProps) => {
    const t = useTranslations('pack-info.extra-pack.dialogo_descargar');
    return (
        <Dialog
            isOpen={open}
            onClose={(() => { onClose(false) })}
            title={t('titulo')}
        >
            <div className="grid grid-cols-1 gap-4">
                {image && (
                    <div>
                        <Image
                            src={image}
                            alt=""
                            width={400}
                            height={500}
                            unoptimized
                        />
                    </div>
                )}
                <div>
                    {t('mensaje')}
                    <br />
                    <Link className='text-blue-500 text-center underline ' href={'/login'}>{t('inicia_sesion')} </Link>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                    <button
                        className="btn-primary w-full text-red-500"
                        type='button'
                        onClick={() => { onClose(false) }}
                    >
                        {t('cerrar')}
                    </button>
                </div>
            </div>
        </Dialog>
    )
}
