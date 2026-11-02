'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPackPlatform } from '@/src/app/types/platform.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeletePlatformProps {
    open: boolean
    onClose: () => void
    item: IAdminPackPlatform | null
    onDeleted: () => void
}

export const DialogDeletePlatform = ({ open, onClose, item, onDeleted }: DialogDeletePlatformProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (item === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<boolean>>('/api/pack/platform', { params: { pack_platform_id: item.pack_platform_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Póster eliminado correctamente' })
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
        <Dialog isOpen={open} onClose={onClose} title="Eliminar póster">
            <div className="grid grid-cols-1 gap-4">
                <p>
                    ¿Seguro que quieres eliminar el póster de <span className='font-bold'>{item?.platform.name}</span>? Se borra el registro y su contador de clics; la imagen se queda en S3. Si solo quieres ocultarlo, desactívalo.
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
