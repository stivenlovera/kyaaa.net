'use client'
import { useEffect, useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPlatform, IFormPlatform } from '@/src/app/types/platform.types'
import { slugify } from '@/src/app/utils/other'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogPlatformFormProps {
    open: boolean
    onClose: () => void
    /** Plataforma a editar; null/undefined para crear una nueva. */
    platform?: IAdminPlatform | null
    onSaved: () => void
}

const emptyForm = { name: '', slug: '', base_url: '', is_external: true, is_payment: false, state: true }

export const DialogPlatformForm = ({ open, onClose, platform, onSaved }: DialogPlatformFormProps) => {
    const { setAlert } = useAlert()
    const isEdit = platform !== null && platform !== undefined
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Reinicia el formulario cada vez que se abre, con los datos de la plataforma si es edición.
    useEffect(() => {
        if (open) {
            setForm(isEdit
                ? {
                    name: platform!.name,
                    slug: platform!.slug,
                    base_url: platform!.base_url ?? '',
                    is_external: platform!.is_external === 1,
                    is_payment: platform!.is_payment === 1,
                    state: platform!.state === 1,
                }
                : emptyForm)
            setError(null)
        }
    }, [open, platform, isEdit])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsPending(true)
        try {
            const body: IFormPlatform = {
                platform_id: platform?.platform_id,
                name: form.name,
                slug: form.slug,
                base_url: form.base_url.trim() === '' ? null : form.base_url,
                is_external: form.is_external ? 1 : 0,
                is_payment: form.is_payment ? 1 : 0,
                state: form.state ? 1 : 0,
            }
            const { data } = isEdit
                ? await API.patch<IResponse<IAdminPlatform>>('/api/platform', body)
                : await API.post<IResponse<IAdminPlatform>>('/api/platform', body)
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: isEdit ? 'Plataforma actualizada correctamente' : 'Plataforma creada correctamente' })
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
        <Dialog isOpen={open} onClose={onClose} title={isEdit ? 'Editar plataforma' : 'Crear plataforma'}
            footer={(
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
                        type='submit' form='dialog-platform-form'
                        disabled={isPending}
                    >
                        {isEdit ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            )}
        >
            <form id='dialog-platform-form' onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-xs font-medium mb-1">Nombre</label>
                        <input
                            id="name"
                            className='w-full'
                            name="name"
                            maxLength={100}
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
                        {isEdit && form.slug !== platform!.slug && (
                            <p className="text-yellow-500 text-xs mt-1">
                                Los pósters ya subidos siguen funcionando; los nuevos se guardarán con el slug nuevo.
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="base_url" className="block text-xs font-medium mb-1">URL base (opcional)</label>
                        <input
                            id="base_url"
                            className='w-full'
                            name="base_url"
                            type="url"
                            maxLength={255}
                            placeholder='https://ko-fi.com/'
                            value={form.base_url}
                            onChange={(e) => {
                                const base_url = e.currentTarget.value
                                setForm((f) => ({ ...f, base_url }))
                            }}
                            disabled={isPending}
                        />
                    </div>
                    <div className='flex items-center gap-2'>
                        <input
                            id="is_external"
                            type="checkbox"
                            checked={form.is_external}
                            onChange={(e) => {
                                const is_external = e.currentTarget.checked
                                setForm((f) => ({ ...f, is_external }))
                            }}
                            disabled={isPending}
                        />
                        <label htmlFor="is_external" className="text-sm">
                            Plataforma externa <span className='text-neutral-400'>(de un tercero: abre en pestaña nueva y con nofollow)</span>
                        </label>
                    </div>
                    <div className='flex items-center gap-2'>
                        <input
                            id="is_payment"
                            type="checkbox"
                            checked={form.is_payment}
                            onChange={(e) => {
                                const is_payment = e.currentTarget.checked
                                setForm((f) => ({ ...f, is_payment }))
                            }}
                            disabled={isPending}
                        />
                        <label htmlFor="is_payment" className="text-sm">
                            Tiene pasarela de pago <span className='text-neutral-400'>(sale en &quot;Compra también por&quot;; si no, en &quot;Síguenos en&quot;)</span>
                        </label>
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
                </div>
            </form>
        </Dialog>
    )
}
