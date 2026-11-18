'use client'
import Link from 'next/link'
import { useRouter } from '@/src/app/layout/components/navigate/use-loading-router'
import { IAdminTicket, TICKET_CATEGORIES, TICKET_STATUSES, TicketCategory, TicketStatus } from '@/src/app/types/ticket.types'
import { TICKET_CATEGORY_LABEL, TICKET_STATUS_LABEL } from '@/src/app/utils/ticket-labels'
import { formatTicketCode } from '@/src/app/utils/ticket-code'
import { LocalDate } from '@/src/app/components/local-date'
import { TicketStatusBadge } from '@/src/app/[locale]/support/_components/ticket-status-badge'

interface TicketListProps {
    tickets: IAdminTicket[]
    total: number
    status?: TicketStatus
    category?: TicketCategory
}

export const TicketList = ({ tickets, total, status, category }: TicketListProps) => {
    const router = useRouter()

    // Cambiar un filtro vuelve a la primera página.
    const setFilter = (next: { status?: string, category?: string }) => {
        const params = new URLSearchParams()
        const s = 'status' in next ? next.status : status
        const c = 'category' in next ? next.category : category
        if (s) params.set('status', s)
        if (c) params.set('category', c)
        const qs = params.toString()
        router.push(qs ? `/admin/ticket?${qs}` : '/admin/ticket')
    }

    return (
        <div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3'>
                <div>
                    <label htmlFor='filter_status' className='block text-xs font-medium mb-1'>Estado</label>
                    <select
                        id='filter_status'
                        className='w-full'
                        value={status ?? ''}
                        onChange={(e) => { setFilter({ status: e.currentTarget.value }) }}
                    >
                        <option value=''>Todos</option>
                        {TICKET_STATUSES.map((s) => (
                            <option key={s} value={s}>{TICKET_STATUS_LABEL[s]}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor='filter_category' className='block text-xs font-medium mb-1'>Categoría</label>
                    <select
                        id='filter_category'
                        className='w-full'
                        value={category ?? ''}
                        onChange={(e) => { setFilter({ category: e.currentTarget.value }) }}
                    >
                        <option value=''>Todas</option>
                        {TICKET_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{TICKET_CATEGORY_LABEL[c]}</option>
                        ))}
                    </select>
                </div>
            </div>
            <p className='text-xs text-neutral-400 pb-2'>{total} ticket(s). <span className='text-yellow-400'>●</span> = falta responder.</p>
            <div className='overflow-x-auto'>
                <table className='w-full text-left text-sm'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'></th>
                            <th className='p-2'>Ticket</th>
                            <th className='p-2'>Asunto</th>
                            <th className='p-2'>Categoría</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Usuario</th>
                            <th className='p-2'>Actualizado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={7}>No hay tickets.</td>
                            </tr>
                        ) : tickets.map((ticket) => (
                            <tr key={ticket.ticket_id} className='border-b border-neutral-800 hover:bg-neutral-800'>
                                <td className='p-2 text-yellow-400' title={ticket.awaiting_staff ? 'Falta responder' : undefined}>
                                    {ticket.awaiting_staff ? '●' : ''}
                                </td>
                                <td className='p-2 font-mono whitespace-nowrap'>
                                    <Link href={`/admin/ticket/${ticket.code}`} className='underline hover:text-white'>{formatTicketCode(ticket.code)}</Link>
                                </td>
                                <td className='p-2 max-w-72 truncate'>
                                    <Link href={`/admin/ticket/${ticket.code}`} className='hover:underline'>{ticket.subject}</Link>
                                </td>
                                <td className='p-2 whitespace-nowrap'>{TICKET_CATEGORY_LABEL[ticket.category]}</td>
                                <td className='p-2 whitespace-nowrap'>
                                    <TicketStatusBadge status={ticket.status} label={TICKET_STATUS_LABEL[ticket.status]} />
                                </td>
                                <td className='p-2'>
                                    {ticket.user !== null
                                        ? <span>{ticket.user.nick}</span>
                                        : <span className='text-neutral-400'>Anónimo</span>}
                                    <span className='block text-xs text-neutral-400'>{ticket.email}</span>
                                </td>
                                <td className='p-2 whitespace-nowrap text-xs'><LocalDate date={ticket.update_at} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
