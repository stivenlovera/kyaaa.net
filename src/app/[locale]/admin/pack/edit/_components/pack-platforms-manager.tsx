'use client'
import { useEffect, useMemo, useState } from 'react'
import { FaPen, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPackPlatform, IPlatform } from '@/src/app/types/platform.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'
import { DialogDeletePlatform } from './dialog-delete-platform'

interface PackPlatformsManagerProps {
    pack_id: number
    platforms: IPlatform[]
    items: IAdminPackPlatform[]
}

const emptyForm = { platform_id: 0, url: '', title: '', sort: '0', active: true }

// Pósters del pack por plataforma (debajo del botón comprar): un formulario para crear o editar
// (la plataforma identifica el póster: elegir una que ya tiene póster lo edita) y la lista con sus clics.
export const PackPlatformsManager = ({ pack_id, platforms, items }: PackPlatformsManagerProps) => {
    const router = useRouter()
    const { setAlert } = useAlert()
    const [form, setForm] = useState(emptyForm)
    const [file, setFile] = useState<File | null>(null)
    // Cambiar la key vacía el <input type="file">, que no se puede controlar con value.
    const [fileKey, setFileKey] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [toDelete, setToDelete] = useState<IAdminPackPlatform | null>(null)

    const current = items.find((item) => item.platform.platform_id === form.platform_id) ?? null
    const preview = useMemo(() => (file === null ? null : URL.createObjectURL(file)), [file])
    useEffect(() => () => {
        if (preview !== null) {
            URL.revokeObjectURL(preview)
        }
    }, [preview])
    const shown = preview ?? current?.poster ?? null

    const load = (next: typeof emptyForm) => {
        setForm(next)
        setFile(null)
        setFileKey((k) => k + 1)
        setError(null)
    }
    const reset = () => { load(emptyForm) }
    const edit = (item: IAdminPackPlatform) => {
        load({ platform_id: item.platform.platform_id, url: item.url, title: item.title ?? '', sort: String(item.sort), active: item.state === 1 })
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        if (form.platform_id === 0) {
            setError('Elige una plataforma')
            return
        }
        if (current === null && file === null) {
            setError('Falta la imagen del póster')
            return
        }
        const formData = new FormData()
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
                setAlert({ open: true, icon: 'success', message: current === null ? 'Póster creado correctamente' : 'Póster actualizado correctamente' })
                reset()
                router.refresh()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className='grid grid-cols-1 gap-4'>
            <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <div>
                    <label htmlFor='platform_id' className='block text-xs font-medium mb-1'>Plataforma</label>
                    <select
                        id='platform_id'
                        className='w-full'
                        value={form.platform_id}
                        onChange={(e) => {
                            const platform_id = Number(e.currentTarget.value)
                            const item = items.find((i) => i.platform.platform_id === platform_id)
                            if (item) {
                                edit(item)
                            } else {
                                load({ ...emptyForm, platform_id })
                            }
                        }}
                        disabled={isPending}
                    >
                        <option value={0}>Elegir…</option>
                        {platforms.map((p) => (
                            <option key={p.platform_id} value={p.platform_id}>
                                {p.name}{items.some((i) => i.platform.platform_id === p.platform_id) ? ' (ya tiene póster)' : ''}
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
                        Póster{current !== null && ' (deja vacío para mantener el actual)'}
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
                <div className='flex gap-3 md:col-span-2'>
                    <button className='btn-primary' type='submit' disabled={isPending}>
                        {current === null ? 'Agregar póster' : 'Guardar cambios'}
                    </button>
                    {form.platform_id !== 0 && (
                        <button className='btn-primary' type='button' onClick={reset} disabled={isPending}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            {items.length === 0 ? (
                <p className='text-sm text-neutral-400'>Este pack todavía no tiene pósters.</p>
            ) : (
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='text-left border-b border-neutral-700'>
                                <th className='p-2'>Póster</th>
                                <th className='p-2'>Plataforma</th>
                                <th className='p-2'>Enlace</th>
                                <th className='p-2'>Orden</th>
                                <th className='p-2'>Clics</th>
                                <th className='p-2'>Estado</th>
                                <th className='p-2'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.pack_platform_id} className='border-b border-neutral-800'>
                                    <td className='p-2'>
                                        <img src={item.poster} alt='' className='w-16 h-20 object-cover rounded bg-neutral-900' />
                                    </td>
                                    <td className='p-2'>{item.platform.name}</td>
                                    <td className='p-2 max-w-48 truncate'>
                                        <a className='text-blue-500 underline' href={item.url} target='_blank' rel='noopener noreferrer'>{item.url}</a>
                                    </td>
                                    <td className='p-2'>{item.sort}</td>
                                    <td className='p-2'>{item.clicks}</td>
                                    <td className='p-2'>{item.state === 1 ? 'Activo' : 'Inactivo'}</td>
                                    <td className='p-2'>
                                        <div className='flex gap-1'>
                                            <button className='btn-primary-icon' type='button' aria-label='Editar' title='Editar' onClick={() => { edit(item) }}>
                                                <FaPen />
                                            </button>
                                            <button className='btn-primary-icon text-red-500' type='button' aria-label='Eliminar' title='Eliminar' onClick={() => { setToDelete(item) }}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <DialogDeletePlatform
                open={toDelete !== null}
                item={toDelete}
                onClose={() => { setToDelete(null) }}
                onDeleted={() => {
                    if (toDelete?.platform.platform_id === form.platform_id) {
                        reset()
                    }
                    router.refresh()
                }}
            />
        </div>
    )
}
