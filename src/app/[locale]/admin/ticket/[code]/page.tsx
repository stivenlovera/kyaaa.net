import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryTicket } from '@/src/app/repositories/ticket.repository'
import { formatTicketCode, normalizeTicketCode } from '@/src/app/utils/ticket-code'
import { TICKET_CATEGORY_LABEL, TICKET_STATUS_LABEL } from '@/src/app/utils/ticket-labels'
import { TicketThread } from '@/src/app/components/ticket-thread'
import { LocalDate } from '@/src/app/components/local-date'
import { TicketStatusBadge } from '@/src/app/[locale]/support/_components/ticket-status-badge'
import { AdminBreadcrumb } from '../../_components/breadcrumb'
import { AdminTicketActions } from './_components/admin-ticket-actions'

export const dynamic = 'force-dynamic'

interface AdminTicketDetailProps {
    params: Promise<{ code: string }>
}

export default async function Page({ params }: AdminTicketDetailProps) {
    await requireAdminPage()
    const { code: rawCode } = await params
    const code = normalizeTicketCode(rawCode)
    const ticket = code !== null ? await repositoryTicket.findDetail(code) : null
    if (ticket === null) {
        notFound()
    }
    const context = ticket.user_id !== null ? await repositoryTicket.findUserContext(ticket.user_id) : null
    const userLabel = context?.user.nick ?? ticket.email

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-40 2xl:px-56 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Tickets', href: '/admin/ticket' }, { label: formatTicketCode(ticket.code) }]} />
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                <div className='card lg:col-span-2 grid grid-cols-1 gap-4'>
                    <div>
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                            <h1 className='text-xl font-bold'>{formatTicketCode(ticket.code)}</h1>
                            <TicketStatusBadge status={ticket.status} label={TICKET_STATUS_LABEL[ticket.status]} />
                        </div>
                        <p className='text-sm font-bold pt-2 break-words'>{ticket.subject}</p>
                        <div className='flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-neutral-400'>
                            <span>{TICKET_CATEGORY_LABEL[ticket.category]}</span>
                            {ticket.pack !== null && (
                                <Link href={`/pack/${ticket.pack.code}`} className='underline hover:text-white'>{ticket.pack.name} ({ticket.pack.code})</Link>
                            )}
                            <span>Creado <LocalDate date={ticket.create_at} /></span>
                        </div>
                    </div>
                    <TicketThread messages={ticket.messages} staffLabel='Soporte' userLabel={userLabel} />
                    <AdminTicketActions code={ticket.code} status={ticket.status} />
                </div>

                <aside className='card text-sm grid grid-cols-1 gap-4 content-start'>
                    <div>
                        <h2 className='font-bold pb-1'>Contacto</h2>
                        <p className='break-all'>{ticket.email}</p>
                        {context === null && <p className='text-xs text-neutral-400'>Ticket sin sesión: solo se puede responder por aquí (le llega por correo).</p>}
                    </div>
                    {context !== null && (
                        <>
                            <div>
                                <h2 className='font-bold pb-1'>Usuario</h2>
                                <p>{context.user.nick} <span className='text-neutral-400'>#{context.user.user_id}</span></p>
                                <p className='break-all text-neutral-400'>{context.user.email}</p>
                                <p className='text-xs text-neutral-400'>
                                    Registrado <LocalDate date={context.user.create_at} withTime={false} /> ·{' '}
                                    {context.user.verified_email ? 'email verificado' : 'email sin verificar'}
                                </p>
                                <Link href={`/admin/user?q=${encodeURIComponent(context.user.email)}`} className='text-xs underline hover:text-white'>Ver en usuarios</Link>
                            </div>
                            <div>
                                <h2 className='font-bold pb-1'>Compras ({context.purchases.length})</h2>
                                {context.purchases.length === 0 ? (
                                    <p className='text-neutral-400'>Sin compras.</p>
                                ) : (
                                    <ul className='grid grid-cols-1 gap-2'>
                                        {context.purchases.map((p) => (
                                            <li key={`${p.pack.code}-${p.method}`} className='rounded-md border border-neutral-700 px-2 py-1'>
                                                <Link href={`/pack/${p.pack.code}`} className='font-bold hover:underline'>{p.pack.name}</Link>
                                                <p className='text-xs text-neutral-400'>
                                                    {p.method} · ${p.price} · <LocalDate date={p.create_at} withTime={false} />
                                                </p>
                                                <p className='text-xs text-neutral-400 font-mono break-all'>{p.transaction}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    )}
                </aside>
            </div>
        </div>
    )
}
