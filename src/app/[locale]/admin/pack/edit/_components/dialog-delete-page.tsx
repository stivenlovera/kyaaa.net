'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPage } from '@/src/app/types/page.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeletePageProps {
    open: boolean
    onClose: () => void
    page: IAdminPage | null
    onDeleted: () => void
}

export const DialogDeletePage = ({ open, onClose, page, onDeleted }: DialogDeletePageProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (page === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<null>>('/api/pack/pages', { data: { page_id: page.page_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Página eliminada correctamente' })
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
        <Dialog isOpen={open} onClose={onClose} title="Eliminar página">
            <div className="grid grid-cols-1 gap-4">
                <p>
                    ¿Seguro que quieres eliminar el registro de la página <span className='font-bold'>{page?.num}</span>? Esto borra el registro de la base de datos, pero no el archivo en S3. Esta acción no se puede deshacer.
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
