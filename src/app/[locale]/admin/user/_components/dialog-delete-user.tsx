'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminUser } from '@/src/app/types/admin-user.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeleteUserProps {
    open: boolean
    onClose: () => void
    user: IAdminUser | null
    onDeleted: () => void
}

export const DialogDeleteUser = ({ open, onClose, user, onDeleted }: DialogDeleteUserProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleClose = () => {
        setError(null)
        onClose()
    }

    const handleDelete = async () => {
        if (user === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<null>>('/api/admin/user', { data: { user_id: user.user_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Usuario eliminado correctamente' })
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
        <Dialog isOpen={open} onClose={handleClose} title="Eliminar usuario">
            <div className="grid grid-cols-1 gap-4">
                <p>
                    ¿Seguro que quieres eliminar a <span className='font-bold'>{user?.name}</span> ({user?.email})?
                    Se borran también sus votos, me gusta y favoritos. Esta acción no se puede deshacer.
                </p>
                {user !== null && user.total_buys > 0 && (
                    <p className="text-yellow-500 text-xs">Tiene {user.total_buys} compra(s): no se podrá eliminar. Desactívalo en su lugar.</p>
                )}
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <div className='flex justify-between gap-3'>
                    <button className="btn-primary w-full" type='button' onClick={handleClose} disabled={isPending}>
                        Cerrar
                    </button>
                    <button className="btn-primary w-full text-red-500" type='button' onClick={handleDelete} disabled={isPending}>
                        Eliminar
                    </button>
                </div>
            </div>
        </Dialog>
    )
}
