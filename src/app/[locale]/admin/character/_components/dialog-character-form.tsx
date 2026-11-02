'use client'
import { useEffect, useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminCharacter } from '@/src/app/types/character.types'
import { slugify } from '@/src/app/utils/other'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogCharacterFormProps {
    open: boolean
    onClose: () => void
    /** Personaje a editar; null/undefined para crear uno nuevo. */
    character?: IAdminCharacter | null
    onSaved: () => void
}

const emptyForm = { name: '', slug: '', state: true }

export const DialogCharacterForm = ({ open, onClose, character, onSaved }: DialogCharacterFormProps) => {
    const { setAlert } = useAlert()
    const isEdit = character !== null && character !== undefined
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Reinicia el formulario cada vez que se abre, con los datos del personaje si es edición.
    useEffect(() => {
        if (open) {
            setForm(isEdit ? { name: character!.name, slug: character!.slug, state: character!.state === 1 } : emptyForm)
            setError(null)
        }
    }, [open, character, isEdit])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsPending(true)
        try {
            const body = { character_id: character?.character_id, name: form.name, slug: form.slug, state: form.state ? 1 : 0 }
            const { data } = isEdit
                ? await API.patch<IResponse<IAdminCharacter>>('/api/character', body)
                : await API.post<IResponse<IAdminCharacter>>('/api/character', body)
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: isEdit ? 'Personaje actualizado correctamente' : 'Personaje creado correctamente' })
                onSaved()
                onClose()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog isOpen={open} onClose={onClose} title={isEdit ? 'Editar personaje' : 'Crear personaje'}>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-xs font-medium mb-1">Nombre</label>
                        <input
                            id="name"
                            className='w-full'
                            name="name"
                            value={form.name}
                            onChange={(e) => {
                                const name = e.currentTarget.value
                                setForm((f) => ({ ...f, name, slug: slugify(name) }))
                            }}
                            disabled={isPending}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="slug" className="block text-xs font-medium mb-1">Slug</label>
                        <input
                            id="slug"
                            className='w-full'
                            name="slug"
                            value={form.slug}
                            // Solo lectura: se genera a partir del nombre.
                            readOnly
                        />
                    </div>
                    <div className='flex items-center gap-2'>
                        <input
                            id="state"
                            type="checkbox"
                            checked={form.state}
                            onChange={(e) => {
                                const state = e.currentTarget.checked
                                setForm((f) => ({ ...f, state }))
                            }}
                            disabled={isPending}
                        />
                        <label htmlFor="state" className="text-sm">Activo</label>
                    </div>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <div className='flex justify-between gap-3'>
                        <button
                            className="btn-primary w-full text-red-500"
                            type='button'
                            onClick={onClose}
                            disabled={isPending}
                        >
                            Cerrar
                        </button>
                        <button
                            className="btn-primary w-full"
                            type='submit'
                            disabled={isPending}
                        >
                            {isEdit ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </div>
            </form>
        </Dialog>
    )
}
