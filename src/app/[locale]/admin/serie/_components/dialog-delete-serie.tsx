'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminSerie } from '@/src/app/types/serie.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeleteSerieProps {
    open: boolean
    onClose: () => void
    serie: IAdminSerie | null
    onDeleted: () => void
}

export const DialogDeleteSerie = ({ open, onClose, serie, onDeleted }: DialogDeleteSerieProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (serie === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<null>>('/api/serie', { data: { serie_id: serie.serie_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Serie eliminada correctamente' })
                onDeleted()
                onClose()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog isOpen={open} onClose={onClose} title="Eliminar serie">
            <div className="grid grid-cols-1 gap-4">
                <p>
                    ¿Seguro que quieres eliminar la serie <span className='font-bold'>{serie?.name}</span>? Esta acción no se puede deshacer.
                </p>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <div className='flex justify-between gap-3'>
                    <button
                        className="btn-primary w-full"
                        type='button'
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Cerrar
                    </button>
                    <button
                        className="btn-primary w-full text-red-500"
                        type='button'
                        onClick={handleDelete}
                        disabled={isPending}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </Dialog>
    )
}
