'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminCharacter } from '@/src/app/types/character.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeleteCharacterProps {
    open: boolean
    onClose: () => void
    character: IAdminCharacter | null
    onDeleted: () => void
}

export const DialogDeleteCharacter = ({ open, onClose, character, onDeleted }: DialogDeleteCharacterProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (character === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<null>>('/api/character', { data: { character_id: character.character_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Personaje eliminado correctamente' })
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
        <Dialog isOpen={open} onClose={onClose} title="Eliminar personaje">
            <div className="grid grid-cols-1 gap-4">
                <p>
                    ¿Seguro que quieres eliminar el personaje <span className='font-bold'>{character?.name}</span>? Esta acción no se puede deshacer.
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
