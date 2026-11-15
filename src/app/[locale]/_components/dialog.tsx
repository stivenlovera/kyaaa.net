'use client'

type ModalDialogProps = {
    onClose: (modal: boolean) => void;
    isOpen: boolean
    children: React.ReactNode
    title: string
    /** Clases del panel para cambiar su ancho (p. ej. 'w-full md:w-[32rem]'); por defecto 'md:w-96'. */
    panelClassName?: string
    /**
     * Botones del modal (Cerrar/Guardar). Se pintan fuera de la zona con scroll, así que se ven siempre.
     * Si el contenido es un <form>, dale un `id` y pon `form={id}` en el botón de enviar.
     */
    footer?: React.ReactNode
};

// El panel nunca supera el alto de la pantalla: el título y el pie quedan fijos y solo el contenido
// hace scroll.
const Dialog = ({ isOpen, onClose, children, title, panelClassName = 'md:w-96', footer }: ModalDialogProps) => {
    if (!isOpen) return null;

    return (
        <div
            // z-40: por encima del contenido aunque el modal se renderice dentro de un elemento con
            // position (p. ej. una tarjeta) y le sigan otros posicionados; los toasts (z-50) quedan encima.
            className="fixed inset-0 z-40 w-screen h-dvh bg-dark-600/50 flex items-center justify-center backdrop-blur-sm p-3 md:p-5"
        >
            <div className={`bg-neutral-800 p-4 rounded-lg shadow-md shadow-black relative flex flex-col max-h-full max-w-full ${panelClassName}`}>
                <div className="flex justify-between px-3 py-2 shrink-0">
                    <p className="text-left text-2xl font-bold">{title}</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="p-3">
                        {children}
                    </div>
                </div>
                {footer && (
                    <div className="shrink-0 px-3 pt-3 border-t border-neutral-700">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
export default Dialog;
