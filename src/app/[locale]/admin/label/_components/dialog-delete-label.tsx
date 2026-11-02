'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminLabel } from '@/src/app/types/label.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeleteLabelProps {
    open: boolean
    onClose: () => void
    label: IAdminLabel | null
    onDeleted: () => void
}

export const DialogDeleteLabel = ({ open, onClose, label, onDeleted }: DialogDeleteLabelProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (label === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<null>>('/api/label', { data: { label_id: label.label_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Etiqueta eliminada correctamente' })
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
        <Dialog isOpen={open} onClose={onClose} title="Eliminar etiqueta">
            <div className="grid grid-cols-1 gap-4">
                <p>
                    ¿Seguro que quieres eliminar la etiqueta <span className='font-bold'>{label?.name}</span>? Esta acción no se puede deshacer.
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
