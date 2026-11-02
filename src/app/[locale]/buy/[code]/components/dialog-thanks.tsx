import React from 'react'
import Dialog from '../../../_components/dialog'
import Image from 'next/image';

interface DialogThanksProps {
    openThanks: boolean;
    onChangeThanks: (open: boolean) => void;
    /** Imagen propia del pack (pack.thanks_image); si no hay, la genérica. */
    image?: string | null;
}
export const DialogThanks = ({ openThanks, onChangeThanks, image }: DialogThanksProps) => {
    return (
        <Dialog
            isOpen={openThanks}
            onClose={(() => { onChangeThanks(false) })}
            title="Gracias por tu compra"
        >
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <Image
                        fetchPriority="high"
                        src={image ?? '/img/thanks.png'}
                        alt={``}
                        width={400}
                        height={500}
                        unoptimized
                        className=""
                    >
                    </Image>
                </div>
                <div>
                    Ya puede acceder a todo el contenido.
                </div>
                <div>
                    <ul>
                        <li>- Descargar</li>
                        <li>- Visualiza</li>
                    </ul>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                    <button
                        className="btn-primary w-full"
                        type='button'
                        onClick={() => { onChangeThanks(false) }}
                    >
                        Continuar
                    </button>
                </div>
            </div>
        </Dialog>
    )
}
