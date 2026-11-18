import { TicketCategory } from '../../types/ticket.types'
import { TICKET_CATEGORY_LABEL } from '../ticket-labels'
import { formatTicketCode } from '../ticket-code'
import { detailsBox, emailLayout, escapeHtml, EMAIL_COLOR, paragraph } from './email-layout'

// Correos de los tickets de soporte. Los textos del usuario se escapan y conservan los saltos de línea.

interface TicketMailData {
  code: string
  category: TicketCategory
  subject: string
  /** Enlace al ticket (con ?t= para abrirlo sin sesión, o al admin). */
  url: string
}

const quote = (text: string): string =>
  `<div style="margin:0 0 16px;padding:12px 16px;background-color:${EMAIL_COLOR.background};border-left:3px solid ${EMAIL_COLOR.button};border-radius:4px;white-space:pre-wrap;">${escapeHtml(text).replace(/\r?\n/g, '<br />')}</div>`

const details = ({ code, category, subject }: TicketMailData): string => detailsBox([
  ['Ticket', formatTicketCode(code)],
  ['Categoría', TICKET_CATEGORY_LABEL[category]],
  ['Asunto', escapeHtml(subject)],
])

/** Al usuario: ticket recibido. */
export const ticketCreatedHtml = (name: string, ticket: TicketMailData): string =>
  emailLayout({
    title: 'Ticket recibido',
    heading: 'Recibimos tu ticket',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph('Gracias por escribirnos. Revisaremos tu caso y te responderemos por este medio; también verás la respuesta en la página del ticket.') +
      details(ticket) +
      paragraph('Si quieres añadir algo, responde desde la página del ticket (no a este correo).'),
    button: { text: 'Ver ticket', url: ticket.url },
    reason: 'Lo recibes porque abriste un ticket de soporte en kyaaa.',
  })

/** Al usuario: el staff respondió. */
export const ticketReplyHtml = (name: string, ticket: TicketMailData, reply: string): string =>
  emailLayout({
    title: 'Nueva respuesta',
    heading: 'Respondimos a tu ticket',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph(`Tienes una respuesta en el ticket <strong>${formatTicketCode(ticket.code)}</strong>:`) +
      quote(reply) +
      paragraph('Para contestar, entra en la página del ticket.'),
    button: { text: 'Ver y responder', url: ticket.url },
    reason: 'Lo recibes porque tienes un ticket de soporte abierto en kyaaa.',
  })

/** Al usuario: ticket marcado como resuelto. */
export const ticketResolvedHtml = (name: string, ticket: TicketMailData): string =>
  emailLayout({
    title: 'Ticket resuelto',
    heading: 'Tu ticket está resuelto',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph(`Marcamos como resuelto el ticket <strong>${formatTicketCode(ticket.code)}</strong>.`) +
      details(ticket) +
      paragraph('Si el problema sigue, responde desde la página del ticket y lo volveremos a abrir.'),
    button: { text: 'Ver ticket', url: ticket.url },
    reason: 'Lo recibes porque abriste un ticket de soporte en kyaaa.',
  })

/** Al staff (SUPPORT_EMAIL): ticket nuevo o mensaje nuevo del usuario. */
export const ticketStaffHtml = (kind: 'nuevo' | 'respuesta', from: string, ticket: TicketMailData, message: string): string =>
  emailLayout({
    title: kind === 'nuevo' ? 'Nuevo ticket' : 'Respuesta en ticket',
    heading: kind === 'nuevo' ? 'Nuevo ticket de soporte' : 'El usuario respondió un ticket',
    body:
      paragraph(`De: <strong>${escapeHtml(from)}</strong>`) +
      details(ticket) +
      quote(message),
    button: { text: 'Abrir en el admin', url: ticket.url },
    reason: 'Lo recibes porque este email está configurado como SUPPORT_EMAIL.',
  })
