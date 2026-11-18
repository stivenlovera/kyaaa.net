import { TicketCategory, TicketStatus } from "../types/ticket.types";

// Nombres en español para el admin y los correos (la interfaz del usuario usa i18n: soporte.categoria.* y
// soporte.estado.*).

export const TICKET_CATEGORY_LABEL: Record<TicketCategory, string> = {
    pago: 'Pago o compra',
    cupon: 'Cupón',
    descarga: 'Descarga',
    cuenta: 'Cuenta o acceso',
    contenido: 'Contenido de un pack',
    otro: 'Otro',
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
    abierto: 'Abierto',
    en_curso: 'En curso',
    esperando_usuario: 'Esperando al usuario',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
};

export const TICKET_STATUS_CLASS: Record<TicketStatus, string> = {
    abierto: 'text-yellow-400',
    en_curso: 'text-sky-400',
    esperando_usuario: 'text-neutral-300',
    resuelto: 'text-green-500',
    cerrado: 'text-neutral-500',
};
