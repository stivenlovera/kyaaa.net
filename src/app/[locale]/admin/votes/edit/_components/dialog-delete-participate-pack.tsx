'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminParticipatePack } from '@/src/app/types/participate.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeleteParticipatePackProps {
    open: boolean
    onClose: () => void
    item: IAdminParticipatePack | null
    onDeleted: () => void
}

export const DialogDeleteParticipatePack = ({ open, onClose, item, onDeleted }: DialogDeleteParticipatePackProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleClose = () => {
        setError(null)
        onClose()
    }

    const handleDelete = async () => {
        if (item === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<boolean>>('/api/participate/pack', { data: { participate_pack_id: item.participate_pack_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Pack quitado correctamente' })
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
        <Dialog isOpen={open} onClose={handleClose} title="Quitar pack">
            <div className="grid grid-cols-1 gap-4">
                <p>
                    ¿Seguro que quieres quitar el pack <span className='font-bold'>{item?.name}</span> de esta participación?
                </p>
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
                        Quitar
                    </button>
                </div>
            </div>
        </Dialog>
    )
}
