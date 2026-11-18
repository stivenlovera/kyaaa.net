import { TicketCategory } from "../types/ticket.types";
import logger, { jsonLog } from "./logger";
import { sendEmail } from "./mail";
import { formatTicketCode } from "./ticket-code";
import { siteUrl } from "./template-mails/email-layout";
import { ticketCreatedHtml, ticketReplyHtml, ticketResolvedHtml, ticketStaffHtml } from "./template-mails/notification-ticket-html";

// Avisos por correo de los tickets. Un fallo del SMTP no debe romper la petición (el ticket ya se
// guardó): se registra en el log y se sigue.

interface TicketRef {
    code: string
    access_token: string
    category: TicketCategory
    subject: string
    email: string
}

/** Enlace al ticket que funciona sin sesión (lleva el access_token). */
export const ticketUserUrl = (t: Pick<TicketRef, 'code' | 'access_token'>) => siteUrl(`/support/${t.code}?t=${t.access_token}`);
const ticketAdminUrl = (code: string) => siteUrl(`/admin/ticket/${code}`);

const safeSend = async (label: string, to: string, subject: string, html: string) => {
    try {
        await sendEmail(to, subject, to, html);
    } catch (error) {
        logger.error(`ticket-mails ${label} ${jsonLog(error)}`);
    }
};

const mailData = (t: TicketRef, url: string) => ({ code: t.code, category: t.category, subject: t.subject, url });

export const ticketMails = {
    created: async (t: TicketRef, name: string, message: string) => {
        await safeSend('created', t.email, `Recibimos tu ticket ${formatTicketCode(t.code)}`, ticketCreatedHtml(name, mailData(t, ticketUserUrl(t))));
        const staff = process.env.SUPPORT_EMAIL;
        if (staff) {
            await safeSend('created-staff', staff, `[Soporte] ${formatTicketCode(t.code)} ${t.subject}`, ticketStaffHtml('nuevo', t.email, mailData(t, ticketAdminUrl(t.code)), message));
        }
    },

    userReplied: async (t: TicketRef, message: string) => {
        const staff = process.env.SUPPORT_EMAIL;
        if (staff) {
            await safeSend('user-reply-staff', staff, `[Soporte] Respuesta en ${formatTicketCode(t.code)}`, ticketStaffHtml('respuesta', t.email, mailData(t, ticketAdminUrl(t.code)), message));
        }
    },

    staffReplied: async (t: TicketRef, name: string, reply: string) => {
        await safeSend('staff-reply', t.email, `Respondimos a tu ticket ${formatTicketCode(t.code)}`, ticketReplyHtml(name, mailData(t, ticketUserUrl(t)), reply));
    },

    resolved: async (t: TicketRef, name: string) => {
        await safeSend('resolved', t.email, `Tu ticket ${formatTicketCode(t.code)} está resuelto`, ticketResolvedHtml(name, mailData(t, ticketUserUrl(t))));
    },
};
