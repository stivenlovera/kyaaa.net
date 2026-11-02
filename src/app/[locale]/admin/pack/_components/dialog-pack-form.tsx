'use client'
import { useEffect, useMemo, useState } from 'react'
import { FaArrowsRotate } from 'react-icons/fa6'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPack, PackMediaField } from '@/src/app/types/pack.types'
import { IStatePack } from '@/src/app/types/state-pack.types'
import { IResponse } from '@/src/app/types/response'
import { generatePackCode } from '@/src/app/utils/other'
import { STATE_PACK } from '@/src/app/utils/page-access'
import API from '@/src/providers/api'

interface DialogPackFormProps {
    open: boolean
    onClose: () => void
    /** Pack a editar; null/undefined para crear uno nuevo. */
    pack?: IAdminPack | null
    states: IStatePack[]
    onSaved: () => void
}

const emptyForm = { name: '', code: '', description: '', price_list: '', state: true, state_pack_id: STATE_PACK.PUBLISHED as number }

const MEDIA_LABELS: Record<PackMediaField, string> = {
    register_image: 'Imagen del modal "Registrate ahora!"',
    thanks_image: 'Imagen del modal "Gracias por tu compra"',
}

type MediaFiles = Record<PackMediaField, File | null>
const emptyMedia: MediaFiles = { register_image: null, thanks_image: null }

interface ImageFieldProps {
    field: PackMediaField
    /** URL de la imagen guardada (edición). */
    current: string | null
    file: File | null
    onChange: (file: File | null) => void
    disabled: boolean
}

// Selector de imagen con vista previa: la elegida, o si no la que ya tiene el pack.
const ImageField = ({ field, current, file, onChange, disabled }: ImageFieldProps) => {
    const preview = useMemo(() => (file === null ? null : URL.createObjectURL(file)), [file])
    useEffect(() => () => {
        if (preview !== null) {
            URL.revokeObjectURL(preview)
        }
    }, [preview])
    const shown = preview ?? current
    return (
        <div>
            <label htmlFor={field} className="block text-xs font-medium mb-1">{MEDIA_LABELS[field]}</label>
            <div className='flex items-center gap-3'>
                {shown
                    ? <img src={shown} alt="" className='w-16 h-20 object-cover rounded bg-neutral-900' />
                    : <div className='w-16 h-20 rounded bg-neutral-900' />}
                <input
                    id={field}
                    className='w-full text-xs'
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={(e) => { onChange(e.currentTarget.files?.[0] ?? null) }}
                    disabled={disabled}
                />
            </div>
        </div>
    )
}

export const DialogPackForm = ({ open, onClose, pack, states, onSaved }: DialogPackFormProps) => {
    const { setAlert } = useAlert()
    const isEdit = pack !== null && pack !== undefined
    const [form, setForm] = useState(emptyForm)
    const [media, setMedia] = useState<MediaFiles>(emptyMedia)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Reinicia el formulario cada vez que se abre, con los datos del pack si es edición.
    // Al crear, precarga un código único generado automáticamente (editable por si se quiere cambiar).
    useEffect(() => {
        if (open) {
            setForm(isEdit
                ? { name: pack!.name, code: pack!.code, description: pack!.description, price_list: String(pack!.price_list), state: pack!.state === 1, state_pack_id: pack!.state_pack_id }
                : { ...emptyForm, code: generatePackCode() })
            setMedia(emptyMedia)
            setError(null)
        }
    }, [open, pack, isEdit])

    // Sube las imágenes elegidas a static (packs/<code>/<campo>.<ext>); devuelve las que fallaron.
    const uploadMedia = async (pack_id: number): Promise<string[]> => {
        const failed: string[] = []
        for (const field of Object.keys(media) as PackMediaField[]) {
            const file = media[field]
            if (file === null) {
                continue
            }
            const formData = new FormData()
            formData.append('pack_id', String(pack_id))
            formData.append('field', field)
            formData.append('file', file)
            try {
                // multipart explícito: con el Content-Type JSON por defecto, axios convertiría el FormData a JSON.
                await API.post<IResponse<string>>('/api/pack/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            } catch (err: any) {
                failed.push(`${MEDIA_LABELS[field]} (${err?.response?.data?.message || 'error del servidor'})`)
            }
        }
        return failed
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsPending(true)
        try {
            const body = {
                pack_id: pack?.pack_id,
                name: form.name,
                code: form.code,
                description: form.description,
                price_list: Number(form.price_list),
                state: form.state ? 1 : 0,
                state_pack_id: form.state_pack_id
            }
            const { data } = isEdit
                ? await API.patch<IResponse<IAdminPack>>('/api/pack', body)
                : await API.post<IResponse<IAdminPack>>('/api/pack', body)
            if (data.success) {
                // El pack ya está guardado: si falla una imagen se avisa y se cierra igual (se reintenta editando),
                // para no volver a crear el pack.
                const failed = await uploadMedia(data.data.pack_id)
                setAlert(failed.length === 0
                    ? { open: true, icon: 'success', message: isEdit ? 'Pack actualizado correctamente' : 'Pack creado correctamente' }
                    : { open: true, icon: 'warning', message: `Pack guardado, pero no se pudo subir: ${failed.join(', ')}` })
                onSaved()
                onClose()
            }
        } catch (err: any) {
            const status = err?.response?.status
            setError(err?.response?.data?.message || 'Error del servidor')
            // Código duplicado al crear: se genera uno nuevo para que el próximo intento no vuelva a chocar.
            if (!isEdit && status === 409) {
                setForm((f) => ({ ...f, code: generatePackCode() }))
            }
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog isOpen={open} onClose={onClose} title={isEdit ? 'Editar pack' : 'Crear pack'}>
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
                                setForm((f) => ({ ...f, name: name }))
                            }}
                            disabled={isPending}
                            autoFocus
                        />
                    </div>
                    {isEdit && (
                        <div>
                            <label className="block text-xs font-medium mb-1">ID</label>
                            <input className='w-full' value={`${pack!.pack_id}-${pack!.code}`} disabled readOnly />
                        </div>
                    )}
                    <div>
                        <label htmlFor="code" className="block text-xs font-medium mb-1">Código</label>
                        <div className='flex gap-2'>
                            <input
                                id="code"
                                className='w-full'
                                name="code"
                                value={form.code}
                                onChange={(e) => {
                                    const code = e.currentTarget.value
                                    setForm((f) => ({ ...f, code: code }))
                                }}
                                disabled={isPending}
                            />
                            {!isEdit && (
                                <button
                                    className='btn-primary-icon'
                                    type='button'
                                    aria-label='Generar otro código'
                                    title='Generar otro código'
                                    onClick={() => { setForm((f) => ({ ...f, code: generatePackCode() })) }}
                                    disabled={isPending}
                                >
                                    <FaArrowsRotate />
                                </button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-xs font-medium mb-1">Descripción</label>
                        <textarea
                            id="description"
                            className='w-full'
                            name="description"
                            rows={3}
                            value={form.description}
                            onChange={(e) => {
                                const description = e.currentTarget.value
                                setForm((f) => ({ ...f, description: description }))
                            }}
                            disabled={isPending}
                        />
                    </div>
                    <div>
                        <label htmlFor="price_list" className="block text-xs font-medium mb-1">Precio</label>
                        <input
                            id="price_list"
                            className='w-full'
                            name="price_list"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price_list}
                            onChange={(e) => {
                                const price_list = e.currentTarget.value
                                setForm((f) => ({ ...f, price_list: price_list }))
                            }}
                            disabled={isPending}
                        />
                    </div>
                    <div>
                        <label htmlFor="state_pack_id" className="block text-xs font-medium mb-1">Estado del pack</label>
                        <select
                            id="state_pack_id"
                            className='w-full'
                            name="state_pack_id"
                            value={form.state_pack_id}
                            onChange={(e) => {
                                const state_pack_id = Number(e.currentTarget.value)
                                setForm((f) => ({ ...f, state_pack_id: state_pack_id }))
                            }}
                            disabled={isPending}
                        >
                            {states.map((s) => (
                                <option key={s.state_pack_id} value={s.state_pack_id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className='flex items-center gap-2'>
                        <input
                            id="state"
                            type="checkbox"
                            checked={form.state}
                            onChange={(e) => {
                                const state = e.currentTarget.checked
                                setForm((f) => ({ ...f, state: state }))
                            }}
                            disabled={isPending}
                        />
                        <label htmlFor="state" className="text-sm">Activo</label>
                    </div>
                    {(Object.keys(MEDIA_LABELS) as PackMediaField[]).map((field) => (
                        <ImageField
                            key={field}
                            field={field}
                            current={isEdit ? pack![field] : null}
                            file={media[field]}
                            onChange={(file) => { setMedia((m) => ({ ...m, [field]: file })) }}
                            disabled={isPending}
                        />
                    ))}
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
