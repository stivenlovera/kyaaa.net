import { IconType } from 'react-icons'

interface ErrorScreenProps {
    /** Código grande de fondo ("404", "500"…). Sin él, solo la tarjeta (enlaces caducados, avisos…). */
    code?: string
    icon: IconType
    /** Color del icono (por defecto gris claro; p. ej. 'text-green-500' para un éxito). */
    iconClassName?: string
    title: string
    message: React.ReactNode
    /** Botones / enlaces de acción. */
    children?: React.ReactNode
    /** Texto pequeño al pie (p. ej. el código de referencia de un error). */
    footnote?: React.ReactNode
}

// Pantalla común de las páginas de error y de estado (404, error inesperado, enlace no válido, email
// verificado…): código grande de fondo opcional, icono, título, explicación y acciones, con el estilo
// de las tarjetas de la web. Sin hooks: sirve en componentes de servidor y de cliente.
export const ErrorScreen = ({ code, icon: Icon, iconClassName = 'text-neutral-300', title, message, children, footnote }: ErrorScreenProps) => (
    <div className='flex flex-1 items-center justify-center px-4 py-10 md:py-20'>
        <div className='relative w-full max-w-lg text-center'>
            {code && (
                <p
                    aria-hidden
                    className='pointer-events-none select-none text-[8rem] md:text-[11rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-600 to-neutral-900'
                >
                    {code}
                </p>
            )}
            <div className={`card relative grid grid-cols-1 gap-4 ${code ? '-mt-10 md:-mt-14' : ''}`}>
                <Icon className={`mx-auto text-4xl ${iconClassName}`} aria-hidden />
                <div>
                    <h1 className='text-xl md:text-2xl font-bold'>{title}</h1>
                    <div className='pt-2 text-sm text-neutral-400'>{message}</div>
                </div>
                {children && <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>{children}</div>}
                {footnote && <div className='text-xs text-neutral-500'>{footnote}</div>}
            </div>
        </div>
    </div>
)
