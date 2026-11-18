'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import Link from 'next/link'
import { FaHeadset, FaPaperPlane } from 'react-icons/fa6'
import API from '@/src/providers/api'
import { useAuth } from '@/src/providers/AuthContext'
import { LoginLink } from '@/src/app/components/login-link'
import { IResponse } from '@/src/app/types/response'
import {
    ANONYMOUS_CATEGORY,
    ITicketCreated,
    TICKET_CATEGORIES,
    TICKET_LIMITS,
    TicketCategory,
    TicketErrorKey,
} from '@/src/app/types/ticket.types'
import { formatTicketCode } from '@/src/app/utils/ticket-code'
import { ticketErrorKey } from '../_service/ticket-error'

interface SupportFormProps {
    initialCategory?: TicketCategory
    pack: { code: string, name: string } | null
}

export const SupportForm = ({ initialCategory, pack }: SupportFormProps) => {
    const t = useTranslations('soporte')
    const { user } = useAuth()
    const anonymous = user === null
    const [category, setCategory] = useState<TicketCategory | ''>(initialCategory ?? '')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [email, setEmail] = useState('')
    const [error, setError] = useState<TicketErrorKey | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [created, setCreated] = useState<ITicketCreated | null>(null)

    // Sin sesión la única categoría posible es 'cuenta'.
    const effectiveCategory: TicketCategory | '' = anonymous ? ANONYMOUS_CATEGORY : category

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.post<IResponse<ITicketCreated>>('/api/ticket', {
                category: effectiveCategory,
                subject,
                message,
                email: anonymous ? email : undefined,
                pack_code: pack?.code,
            })
            setCreated(data.data)
        } catch (err) {
            setError(ticketErrorKey(isAxiosError(err) ? err.response?.data?.message : undefined))
        } finally {
            setIsPending(false)
        }
    }

    if (created !== null) {
        return (
            <div className='card grid grid-cols-1 gap-4 text-center'>
                <FaHeadset className='text-5xl mx-auto text-green-500' />
                <h1 className='text-2xl font-bold'>{t('exito_titulo')}</h1>
                <p className='text-sm'>
                    {t.rich('exito', { code: formatTicketCode(created.code), b: (chunks) => <span className='font-bold'>{chunks}</span> })}
                </p>
                <Link href={`/support/${created.code}?t=${created.access_token}`} className='btn-primary w-full'>{t('ver_ticket')}</Link>
                {!anonymous && <Link href='/my-tickets' className='btn-primary w-full'>{t('mis_tickets')}</Link>}
            </div>
        )
    }

    return (
        <form className='card grid grid-cols-1 gap-4' onSubmit={handleSubmit}>
            <div className='text-center'>
                <FaHeadset className='text-5xl mx-auto pb-2' />
                <h1 className='text-2xl font-bold'>{t('titulo')}</h1>
                <p className='text-sm text-neutral-400 pt-2'>{t('descripcion')}</p>
            </div>

            {anonymous && (
                <p className='text-sm rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2'>
                    {t.rich('anonimo_aviso', {
                        login: (chunks) => <LoginLink className='underline hover:text-white'>{chunks}</LoginLink>,
                    })}
                </p>
            )}

            <div>
                <label htmlFor='category' className='block text-xs font-medium mb-1'>{t('categoria_label')}</label>
                <select
                    id='category'
                    className='w-full'
                    value={effectiveCategory}
                    onChange={(e) => { setCategory(e.currentTarget.value as TicketCategory); setError(null) }}
                    disabled={isPending || anonymous}
                    required
                >
                    <option value='' disabled>—</option>
                    {TICKET_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{t(`categoria.${c}`)}</option>
                    ))}
                </select>
            </div>

            {pack !== null && (
                <div>
                    <span className='block text-xs font-medium mb-1'>{t('pack_label')}</span>
                    <Link href={`/pack/${pack.code}`} className='text-sm underline hover:text-white'>{pack.name}</Link>
                </div>
            )}

            {anonymous && (
                <div>
                    <label htmlFor='email' className='block text-xs font-medium mb-1'>{t('email_label')}</label>
                    <input
                        id='email'
                        type='email'
                        className='w-full'
                        value={email}
                        maxLength={TICKET_LIMITS.email}
                        autoComplete='email'
                        onChange={(e) => { setEmail(e.currentTarget.value); setError(null) }}
                        disabled={isPending}
                        required
                    />
                    <p className='text-xs text-neutral-400 pt-1'>{t('email_ayuda')}</p>
                </div>
            )}

            <div>
                <label htmlFor='subject' className='block text-xs font-medium mb-1'>{t('asunto_label')}</label>
                <input
                    id='subject'
                    className='w-full'
                    value={subject}
                    placeholder={t('asunto_placeholder')}
                    minLength={3}
                    maxLength={TICKET_LIMITS.subject}
                    onChange={(e) => { setSubject(e.currentTarget.value); setError(null) }}
                    disabled={isPending}
                    required
                />
            </div>

            <div>
                <label htmlFor='message' className='block text-xs font-medium mb-1'>{t('mensaje_label')}</label>
                <textarea
                    id='message'
                    className='w-full min-h-40'
                    value={message}
                    placeholder={t('mensaje_placeholder')}
                    minLength={10}
                    maxLength={TICKET_LIMITS.body}
                    onChange={(e) => { setMessage(e.currentTarget.value); setError(null) }}
                    disabled={isPending}
                    required
                />
                <p className='text-xs text-neutral-400 text-right'>{message.length}/{TICKET_LIMITS.body}</p>
            </div>

            {error && <p className='text-red-500 text-xs'>{t(`error.${error}`)}</p>}

            <button className='btn-primary w-full' type='submit' disabled={isPending || effectiveCategory === ''}>
                <FaPaperPlane aria-hidden />
                {isPending ? t('enviando') : t('enviar')}
            </button>
        </form>
    )
}
