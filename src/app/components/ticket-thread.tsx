import { ITicketMessage } from '@/src/app/types/ticket.types'
import { LocalDate } from './local-date'

interface TicketThreadProps {
    messages: ITicketMessage[]
    /** Nombre que se muestra en los mensajes del staff. */
    staffLabel: string
    /** Nombre que se muestra en los mensajes del usuario. */
    userLabel: string
}

// Conversación de un ticket: mensajes del usuario a la izquierda y del staff a la derecha, con otro
// fondo. El texto se muestra tal cual (React lo escapa) conservando los saltos de línea.
export const TicketThread = ({ messages, staffLabel, userLabel }: TicketThreadProps) => (
    <ol className='flex flex-col gap-3'>
        {messages.map((message) => (
            <li
                key={message.ticket_message_id}
                className={`max-w-[90%] rounded-lg border px-3 py-2 text-sm ${message.is_staff
                    ? 'self-end border-neutral-600 bg-neutral-700'
                    : 'self-start border-neutral-700 bg-neutral-900'}`}
            >
                <div className='flex flex-wrap items-baseline justify-between gap-x-3 pb-1 text-xs text-neutral-400'>
                    <span className='font-bold text-neutral-200'>{message.is_staff ? staffLabel : userLabel}</span>
                    <LocalDate date={message.create_at} />
                </div>
                <p className='whitespace-pre-wrap break-words'>{message.body}</p>
            </li>
        ))}
    </ol>
)
