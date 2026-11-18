'use client'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { FaPaperPlane } from 'react-icons/fa6'
import API from '@/src/providers/api'
import { useRouter } from '@/src/app/layout/components/navigate/use-loading-router'
import { useToast } from '@/src/providers/toastProvider'
import { TICKET_LIMITS, TICKET_STATUSES, TicketStatus } from '@/src/app/types/ticket.types'
import { TICKET_STATUS_LABEL } from '@/src/app/utils/ticket-labels'

interface AdminTicketActionsProps {
    code: string
    status: TicketStatus
}

// Responder y/o cambiar el estado. Al responder, el estado pasa solo a "Esperando al usuario" (salvo que
// se elija otro); al marcar "Resuelto" se avisa al usuario por correo.
export const AdminTicketActions = ({ code, status }: AdminTicketActionsProps) => {
    const router = useRouter()
    const { showToast } = useToast()
    const [body, setBody] = useState('')
    const [nextStatus, setNextStatus] = useState<TicketStatus | ''>('')
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setIsPending(true)
        try {
            await API.post('/api/ticket/admin', {
                code,
                body: body.trim() === '' ? undefined : body,
                status: nextStatus === '' ? undefined : nextStatus,
            })
            setBody('')
            setNextStatus('')
            showToast('Ticket actualizado')
            router.refresh()
        } catch (err) {
            showToast(isAxiosError(err) && err.response?.data?.message ? err.response.data.message : 'No se pudo actualizar el ticket', 'danger')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form className='grid grid-cols-1 gap-3 border-t border-neutral-700 pt-4' onSubmit={handleSubmit}>
            <div>
                <label htmlFor='admin_reply' className='block text-xs font-medium mb-1'>Respuesta (se envía por correo al usuario)</label>
                <textarea
                    id='admin_reply'
                    className='w-full min-h-32'
                    value={body}
                    maxLength={TICKET_LIMITS.body}
                    onChange={(e) => { setBody(e.currentTarget.value) }}
                    disabled={isPending}
                />
            </div>
            <div className='flex flex-col sm:flex-row sm:items-end gap-3'>
                <div className='flex-1'>
                    <label htmlFor='admin_status' className='block text-xs font-medium mb-1'>Cambiar estado</label>
                    <select
                        id='admin_status'
                        className='w-full'
                        value={nextStatus}
                        onChange={(e) => { setNextStatus(e.currentTarget.value as TicketStatus | '') }}
                        disabled={isPending}
                    >
                        <option value=''>Sin cambios (ahora: {TICKET_STATUS_LABEL[status]})</option>
                        {TICKET_STATUSES.filter((s) => s !== status).map((s) => (
                            <option key={s} value={s}>{TICKET_STATUS_LABEL[s]}</option>
                        ))}
                    </select>
                </div>
                <button
                    className='btn-primary sm:w-auto w-full'
                    type='submit'
                    disabled={isPending || (body.trim() === '' && nextStatus === '')}
                >
                    <FaPaperPlane aria-hidden />
                    {isPending ? 'Guardando…' : body.trim() !== '' ? 'Responder' : 'Guardar estado'}
                </button>
            </div>
        </form>
    )
}
