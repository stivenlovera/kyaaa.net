import { TicketErrorKey } from '@/src/app/types/ticket.types'

const KEYS: TicketErrorKey[] = ['categoria', 'asunto', 'mensaje', 'email', 'requiere_sesion', 'cerrado', 'demasiados_intentos', 'servidor']

/** Convierte el `message` de un error de /api/ticket en una clave de soporte.error.*; 'servidor' si no se reconoce. */
export const ticketErrorKey = (message: unknown): TicketErrorKey =>
    KEYS.find((key) => key === message) ?? 'servidor'
