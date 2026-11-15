'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FaChevronDown, FaChevronUp, FaClockRotateLeft } from 'react-icons/fa6'

interface ParticipateHistoryProps {
    /** Número de votaciones finalizadas (se muestra en el botón). */
    count: number
    /** Las secciones de las votaciones finalizadas (se renderizan en el servidor). */
    children: React.ReactNode
}

// Historial de votaciones finalizadas: oculto por defecto, se despliega con "Ver historial".
export const ParticipateHistory = ({ count, children }: ParticipateHistoryProps) => {
    const t = useTranslations('participa')
    const [open, setOpen] = useState(false)

    return (
        <div className='grid grid-cols-1 gap-4'>
            <div className='flex justify-center'>
                <button
                    className='btn-primary flex items-center gap-2'
                    type='button'
                    onClick={() => { setOpen((o) => !o) }}
                    aria-expanded={open}
                    aria-controls='participate-history'
                >
                    <FaClockRotateLeft />
                    {open ? t('ocultar_historial') : t('ver_historial', { count })}
                    {open ? <FaChevronUp /> : <FaChevronDown />}
                </button>
            </div>
            <div id='participate-history' className='grid grid-cols-1 gap-4' hidden={!open}>
                {children}
            </div>
        </div>
    )
}
