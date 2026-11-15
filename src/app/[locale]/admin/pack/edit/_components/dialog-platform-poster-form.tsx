'use client'
import { useEffect, useMemo, useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPackPlatform, IPlatform } from '@/src/app/types/platform.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogPlatformPosterFormProps {
    open: boolean
    onClose: () => void
    pack_id: number
    platforms: IPlatform[]
    /** Pósters actuales del pack. */
    items: IAdminPackPlatform[]
    /** Póster a editar; null para agregar uno nuevo. */
    item: IAdminPackPlatform | null
    onSaved: () => void
}

const emptyForm = { platform_id: 0, url: '', title: '', sort: '0', active: true }

const toForm = (item: IAdminPackPlatform) => ({
    platform_id: item.platform.platform_id,
    url: item.url,
    title: item.title ?? '',
    sort: String(item.sort),
    active: item.state === 1,
})

// Formulario para agregar o editar un póster del pack. Un pack puede tener varios pósters en la misma
// plataforma: el póster se identifica por su pack_platform_id, no por la plataforma.
export const DialogPlatformPosterForm = ({ open, onClose, pack_id, platforms, items, item, onSaved }: DialogPlatformPosterFormProps) => {
    const { setAlert } = useAlert()
    const [form, setForm] = useState(emptyForm)
    const [file, setFile] = useState<File | null>(null)
    // Cambiar la key vacía el <input type="file">, que no se puede controlar con value.
    const [fileKey, setFileKey] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const load = (next: typeof emptyForm) => {
        setForm(next)
        setFile(null)
        setFileKey((k) => k + 1)
        setError(null)
    }

    // Reinicia el formulario cada vez que se abre, con los datos del póster si es edición.
    useEffect(() => {
        if (open) {
            load(item !== null ? toForm(item) : emptyForm)
        }
    }, [open, item])

    const isEdit = item !== null
    // Cuántos pósters tiene ya el pack en cada plataforma (sin contar el que se edita).
    const countByPlatform = (platform_id: number) =>
        items.filter((i) => i.platform.platform_id === platform_id && i.pack_platform_id !== item?.pack_platform_id).length
    const preview = useMemo(() => (file === null ? null : URL.createObjectURL(file)), [file])
    useEffect(() => () => {
        if (preview !== null) {
            URL.revokeObjectURL(preview)
        }
    }, [preview])
    const shown = preview ?? item?.poster ?? null

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        if (form.platform_id === 0) {
            setError('Elige una plataforma')
            return
        }
        if (!isEdit && file === null) {
            setError('Falta la imagen del póster')
            return
        }
        const formData = new FormData()
        if (isEdit) {
            formData.append('pack_platform_id', String(item.pack_platform_id))
        }
        formData.append('pack_id', String(pack_id))
        formData.append('platform_id', String(form.platform_id))
        formData.append('url', form.url)
        formData.append('title', form.title)
        formData.append('sort', form.sort)
        formData.append('state', form.active ? '1' : '0')
        if (file !== null) {
            formData.append('file', file)
        }
        setIsPending(true)
        try {
            // multipart explícito: con el Content-Type JSON por defecto, axios convertiría el FormData a JSON.
            const { data } = await API.post<IResponse<boolean>>('/api/pack/platform', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: isEdit ? 'Póster actualizado correctamente' : 'Póster creado correctamente' })
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
        <Dialog
            isOpen={open}
            onClose={onClose}
            title={isEdit ? 'Editar póster' : 'Agregar póster'}
            panelClassName='w-full md:w-[40rem] max-h-[90vh] overflow-y-auto'
        >
            <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <div>
                    <label htmlFor='platform_id' className='block text-xs font-medium mb-1'>Plataforma</label>
                    <select
                        id='platform_id'
                        className='w-full'
                        value={form.platform_id}
                        onChange={(e) => {
                            const platform_id = Number(e.currentTarget.value)
                            setForm((f) => ({ ...f, platform_id }))
                        }}
                        disabled={isPending}
                    >
                        <option value={0}>Elegir…</option>
                        {/* Al editar, la plataforma puede estar inactiva y no venir en `platforms`. */}
                        {item !== null && !platforms.some((p) => p.platform_id === item.platform.platform_id) && (
                            <option value={item.platform.platform_id}>{item.platform.name} (inactiva)</option>
                        )}
                        {platforms.map((p) => (
                            <option key={p.platform_id} value={p.platform_id}>
                                {p.name}{countByPlatform(p.platform_id) > 0 ? ` (ya tiene ${countByPlatform(p.platform_id)})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor='platform_url' className='block text-xs font-medium mb-1'>Enlace a la publicación del pack</label>
                    <input
                        id='platform_url'
                        className='w-full'
                        type='url'
                        placeholder='https://ko-fi.com/...'
                        value={form.url}
                        onChange={(e) => {
                            const url = e.currentTarget.value
                            setForm((f) => ({ ...f, url }))
                        }}
                        disabled={isPending}
                        required
                    />
                </div>
                <div>
                    <label htmlFor='platform_title' className='block text-xs font-medium mb-1'>Texto alternativo (opcional)</label>
                    <input
                        id='platform_title'
                        className='w-full'
                        placeholder='Apóyame en Ko-fi'
                        value={form.title}
                        onChange={(e) => {
                            const title = e.currentTarget.value
                            setForm((f) => ({ ...f, title }))
                        }}
                        disabled={isPending}
                    />
                </div>
                <div className='flex items-end gap-3'>
                    <div>
                        <label htmlFor='platform_sort' className='block text-xs font-medium mb-1'>Orden</label>
                        <input
                            id='platform_sort'
                            className='w-24'
                            type='number'
                            value={form.sort}
                            onChange={(e) => {
                                const sort = e.currentTarget.value
                                setForm((f) => ({ ...f, sort }))
                            }}
                            disabled={isPending}
                        />
                    </div>
                    <label className='flex items-center gap-2 text-sm pb-2'>
                        <input
                            type='checkbox'
                            checked={form.active}
                            onChange={(e) => {
                                const active = e.currentTarget.checked
                                setForm((f) => ({ ...f, active }))
                            }}
                            disabled={isPending}
                        />
                        Activo
                    </label>
                </div>
                <div className='md:col-span-2'>
                    <label htmlFor='platform_file' className='block text-xs font-medium mb-1'>
                        Póster (JPG, PNG, WEBP o AVIF, máx. 5 MB){isEdit && ' — deja vacío para mantener el actual'}
                    </label>
                    <div className='flex items-center gap-3'>
                        {shown
                            ? <img src={shown} alt='' className='w-16 h-20 object-cover rounded bg-neutral-900' />
                            : <div className='w-16 h-20 rounded bg-neutral-900' />}
                        <input
                            key={fileKey}
                            id='platform_file'
                            className='w-full text-xs'
                            type='file'
                            accept='image/jpeg,image/png,image/webp,image/avif'
                            onChange={(e) => { setFile(e.currentTarget.files?.[0] ?? null) }}
                            disabled={isPending}
                        />
                    </div>
                </div>
                {error && <p className='text-red-500 text-xs md:col-span-2'>{error}</p>}
                <div className='flex justify-between gap-3 md:col-span-2'>
                    <button className='btn-primary w-full text-red-500' type='button' onClick={onClose} disabled={isPending}>
                        Cerrar
                    </button>
                    <button className='btn-primary w-full' type='submit' disabled={isPending}>
                        {isEdit ? 'Guardar cambios' : 'Agregar póster'}
                    </button>
                </div>
            </form>
        </Dialog>
    )
}
