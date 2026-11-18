// Tickets de soporte (/support, /my-tickets, /admin/ticket). Categorías y estados se guardan como texto
// en la tabla `ticket`; estas listas son la única fuente de valores válidos.

export const TICKET_CATEGORIES = ['pago', 'cupon', 'descarga', 'cuenta', 'contenido', 'otro'] as const;
export type TicketCategory = typeof TICKET_CATEGORIES[number];

/** Única categoría que admite tickets sin sesión: quien no puede entrar a su cuenta no puede iniciar sesión. */
export const ANONYMOUS_CATEGORY: TicketCategory = 'cuenta';

export const TICKET_STATUSES = ['abierto', 'en_curso', 'esperando_usuario', 'resuelto', 'cerrado'] as const;
export type TicketStatus = typeof TICKET_STATUSES[number];

/** Estados en los que el ticket se da por terminado (se guarda closed_at). */
export const FINISHED_STATUSES: TicketStatus[] = ['resuelto', 'cerrado'];

export const TICKET_LIMITS = {
    subject: 150,
    body: 4000,
    email: 250,
} as const;

export const isTicketCategory = (value: unknown): value is TicketCategory =>
    typeof value === 'string' && (TICKET_CATEGORIES as readonly string[]).includes(value);

export const isTicketStatus = (value: unknown): value is TicketStatus =>
    typeof value === 'string' && (TICKET_STATUSES as readonly string[]).includes(value);

export interface ITicketMessage {
    ticket_message_id: number
    is_staff: boolean
    body: string
    create_at: Date
    user: { nick: string } | null
}

export interface ITicketSummary {
    ticket_id: number
    code: string
    category: TicketCategory
    subject: string
    status: TicketStatus
    create_at: Date
    update_at: Date
    pack: { code: string, name: string } | null
}

export interface ITicketDetail extends ITicketSummary {
    email: string
    user_id: number | null
    access_token: string
    messages: ITicketMessage[]
}

export interface IAdminTicket extends ITicketSummary {
    email: string
    user: { user_id: number, nick: string } | null
    /** El último mensaje es del usuario: falta responder. */
    awaiting_staff: boolean
}

export interface IAdminTicketPage {
    tickets: IAdminTicket[]
    total: number
}

/** Cuerpo de POST /api/ticket. */
export interface IFormTicketCreate {
    category: string
    subject: string
    message: string
    /** Solo sin sesión (categoría 'cuenta'). */
    email?: string
    /** Código del pack relacionado (viene del botón "Reportar problema" de /pack/<code>). */
    pack_code?: string
}

/** Respuesta de POST /api/ticket. */
export interface ITicketCreated {
    code: string
    /** Para abrir /support/<code>?t=… sin sesión. */
    access_token: string
}

/** Errores de creación/respuesta que el cliente traduce (soporte.error.*). */
export type TicketErrorKey =
    | 'categoria'
    | 'asunto'
    | 'mensaje'
    | 'email'
    | 'requiere_sesion'
    | 'cerrado'
    | 'demasiados_intentos'
    | 'servidor'
