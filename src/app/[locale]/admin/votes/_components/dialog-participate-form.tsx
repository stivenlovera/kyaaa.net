'use client'
import { useEffect, useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminParticipate, IFormParticipate, IStateParticipate } from '@/src/app/types/participate.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogParticipateFormProps {
    open: boolean
    onClose: () => void
    /** Participación a editar; null/undefined para crear una nueva. */
    participate?: IAdminParticipate | null
    states: IStateParticipate[]
    onSaved: () => void
}

const emptyForm = { name: '', start_date: '', start_end: '', state_participate_id: 0 }

export const DialogParticipateForm = ({ open, onClose, participate, states, onSaved }: DialogParticipateFormProps) => {
    const { setAlert } = useAlert()
    const isEdit = participate !== null && participate !== undefined
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Reinicia el formulario cada vez que se abre, con los datos de la participación si es edición.
    useEffect(() => {
        if (open) {
            setForm(isEdit
                ? {
                    name: participate!.name,
                    start_date: participate!.start_date,
                    start_end: participate!.start_end,
                    state_participate_id: participate!.state_participate_id,
                }
                : { ...emptyForm, state_participate_id: states[0]?.state_participate_id ?? 0 })
            setError(null)
        }
    }, [open, participate, isEdit, states])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        if (form.start_date !== '' && form.start_end !== '' && form.start_end < form.start_date) {
            setError('La fecha de fin no puede ser anterior a la de inicio')
            return
        }
        setIsPending(true)
        try {
            const body: IFormParticipate = { participate_id: participate?.participate_id, ...form }
            const { data } = isEdit
                ? await API.patch<IResponse<IAdminParticipate>>('/api/participate', body)
                : await API.post<IResponse<IAdminParticipate>>('/api/participate', body)
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: isEdit ? 'Participación actualizada correctamente' : 'Participación creada correctamente' })
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
        <Dialog isOpen={open} onClose={onClose} title={isEdit ? 'Editar participación' : 'Crear participación'}>
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
                                setForm((f) => ({ ...f, name }))
                            }}
                            disabled={isPending}
                            required
                            autoFocus
                        />
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor="start_date" className="block text-xs font-medium mb-1">Fecha de inicio</label>
                            <input
                                id="start_date"
                                className='w-full'
                                type="date"
                                value={form.start_date}
                                onChange={(e) => {
                                    const start_date = e.currentTarget.value
                                    setForm((f) => ({ ...f, start_date }))
                                }}
                                disabled={isPending}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="start_end" className="block text-xs font-medium mb-1">Fecha de fin</label>
                            <input
                                id="start_end"
                                className='w-full'
                                type="date"
                                min={form.start_date || undefined}
                                value={form.start_end}
                                onChange={(e) => {
                                    const start_end = e.currentTarget.value
                                    setForm((f) => ({ ...f, start_end }))
                                }}
                                disabled={isPending}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="state_participate_id" className="block text-xs font-medium mb-1">Estado</label>
                        <select
                            id="state_participate_id"
                            className='w-full'
                            value={form.state_participate_id}
                            onChange={(e) => {
                                const state_participate_id = Number(e.currentTarget.value)
                                setForm((f) => ({ ...f, state_participate_id }))
                            }}
                            disabled={isPending}
                        >
                            {states.length === 0 && <option value={0}>No hay estados (ejecuta la migración)</option>}
                            {states.map((s) => (
                                <option key={s.state_participate_id} value={s.state_participate_id}>{s.name}</option>
                            ))}
                        </select>
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
