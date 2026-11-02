'use client'
import { useEffect, useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminSerie } from '@/src/app/types/serie.types'
import { slugify } from '@/src/app/utils/other'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogSerieFormProps {
    open: boolean
    onClose: () => void
    /** Serie a editar; null/undefined para crear una nueva. */
    serie?: IAdminSerie | null
    onSaved: () => void
}

const emptyForm = { name: '', slug: '', state: true }

export const DialogSerieForm = ({ open, onClose, serie, onSaved }: DialogSerieFormProps) => {
    const { setAlert } = useAlert()
    const isEdit = serie !== null && serie !== undefined
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Reinicia el formulario cada vez que se abre, con los datos de la serie si es edición.
    useEffect(() => {
        if (open) {
            setForm(isEdit ? { name: serie!.name, slug: serie!.slug, state: serie!.state === 1 } : emptyForm)
            setError(null)
        }
    }, [open, serie, isEdit])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsPending(true)
        try {
            const body = { serie_id: serie?.serie_id, name: form.name, slug: form.slug, state: form.state ? 1 : 0 }
            const { data } = isEdit
                ? await API.patch<IResponse<IAdminSerie>>('/api/serie', body)
                : await API.post<IResponse<IAdminSerie>>('/api/serie', body)
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: isEdit ? 'Serie actualizada correctamente' : 'Serie creada correctamente' })
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
        <Dialog isOpen={open} onClose={onClose} title={isEdit ? 'Editar serie' : 'Crear serie'}>
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
                        <label htmlFor="state" className="text-sm">Activa</label>
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
