import { TicketStatus } from '@/src/app/types/ticket.types'
import { TICKET_STATUS_CLASS } from '@/src/app/utils/ticket-labels'

/** Estado del ticket como etiqueta; el texto lo pasa quien la usa (i18n en la web, español en el admin). */
export const TicketStatusBadge = ({ status, label }: { status: TicketStatus, label: string }) => (
    <span className={`inline-block rounded-full border border-neutral-600 px-2 py-0.5 text-xs font-bold ${TICKET_STATUS_CLASS[status]}`}>
        {label}
    </span>
)
