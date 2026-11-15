'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminParticipate } from '@/src/app/types/participate.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeleteParticipateProps {
    open: boolean
    onClose: () => void
    participate: IAdminParticipate | null
    onDeleted: () => void
}

export const DialogDeleteParticipate = ({ open, onClose, participate, onDeleted }: DialogDeleteParticipateProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleClose = () => {
        setError(null)
        onClose()
    }

    const handleDelete = async () => {
        if (participate === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<null>>('/api/participate', { data: { participate_id: participate.participate_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Participación eliminada correctamente' })
                onDeleted()
                handleClose()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog isOpen={open} onClose={handleClose} title="Eliminar participación">
            <div className="grid grid-cols-1 gap-4">
                <p>
                    ¿Seguro que quieres eliminar la participación <span className='font-bold'>{participate?.name}</span>?
                    {participate !== null && participate.total_packs > 0 && ` También se quitarán sus ${participate.total_packs} pack(s) inscritos.`}
                    {' '}Esta acción no se puede deshacer.
                </p>
                {participate !== null && participate.total_votes > 0 && (
                    <p className="text-yellow-500 text-xs">Tiene {participate.total_votes} voto(s): no se podrá eliminar.</p>
                )}
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <div className='flex justify-between gap-3'>
                    <button
                        className="btn-primary w-full"
                        type='button'
                        onClick={handleClose}
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
