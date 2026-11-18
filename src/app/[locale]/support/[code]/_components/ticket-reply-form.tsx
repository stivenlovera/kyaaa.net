'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { FaPaperPlane } from 'react-icons/fa6'
import API from '@/src/providers/api'
import { useRouter } from '@/src/app/layout/components/navigate/use-loading-router'
import { TICKET_LIMITS, TicketErrorKey } from '@/src/app/types/ticket.types'
import { ticketErrorKey } from '../../_service/ticket-error'

interface TicketReplyFormProps {
    code: string
    /** access_token del enlace del correo (sin sesión). */
    token?: string
}

export const TicketReplyForm = ({ code, token }: TicketReplyFormProps) => {
    const t = useTranslations('soporte')
    const router = useRouter()
    const [body, setBody] = useState('')
    const [error, setError] = useState<TicketErrorKey | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsPending(true)
        try {
            await API.post('/api/ticket/message', { code, body, token })
            setBody('')
            // Vuelve a pedir la página para mostrar el mensaje nuevo y el estado actualizado.
            router.refresh()
        } catch (err) {
            setError(ticketErrorKey(isAxiosError(err) ? err.response?.data?.message : undefined))
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form className='grid grid-cols-1 gap-2' onSubmit={handleSubmit}>
            <label htmlFor='reply' className='block text-xs font-medium'>{t('ticket.responder_label')}</label>
            <textarea
                id='reply'
                className='w-full min-h-28'
                value={body}
                maxLength={TICKET_LIMITS.body}
                onChange={(e) => { setBody(e.currentTarget.value); setError(null) }}
                disabled={isPending}
                required
            />
            {error && <p className='text-red-500 text-xs'>{t(`error.${error}`)}</p>}
            <button className='btn-primary w-full' type='submit' disabled={isPending || body.trim() === ''}>
                <FaPaperPlane aria-hidden />
                {isPending ? t('ticket.enviando') : t('ticket.responder')}
            </button>
        </form>
    )
}
