import { NextRequest, NextResponse } from "next/server";
import { adminDenied, getCurrentUser } from "@/src/app/utils/auth";
import { repositoryTicket } from "@/src/app/repositories/ticket.repository";
import { repositoryAuth } from "@/src/app/repositories/auth.repository";
import { isTicketStatus, TICKET_LIMITS, TicketStatus } from "@/src/app/types/ticket.types";
import { IResponse } from "@/src/app/types/response";
import { normalizeTicketCode } from "@/src/app/utils/ticket-code";
import { ticketMails } from "@/src/app/utils/ticket-mails";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { cleanText } from "../_utils";

// El staff responde y/o cambia el estado de un ticket (solo admin). Si vienen las dos cosas, primero se
// guarda la respuesta (que mueve el estado sola) y luego se aplica el estado elegido.
export async function POST(request: NextRequest) {
    logger.info(`api/ticket/admin POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const admin = (await getCurrentUser())!;
        const body: { code?: string, body?: string, status?: string } = await request.json();
        const code = normalizeTicketCode(body.code ?? '');
        const ticket = code !== null ? await repositoryTicket.findDetail(code) : null;
        if (ticket === null) {
            return NextResponse.json({ success: false, message: 'El ticket no existe' }, { status: 404 });
        }
        const reply = cleanText(body.body);
        if (reply.length > TICKET_LIMITS.body) {
            return NextResponse.json({ success: false, message: `La respuesta supera los ${TICKET_LIMITS.body} caracteres` }, { status: 400 });
        }
        if (body.status !== undefined && !isTicketStatus(body.status)) {
            return NextResponse.json({ success: false, message: 'Estado no válido' }, { status: 400 });
        }
        if (reply === '' && body.status === undefined) {
            return NextResponse.json({ success: false, message: 'Escribe una respuesta o elige un estado' }, { status: 400 });
        }

        const owner = ticket.user_id !== null ? await repositoryAuth.findUserById(ticket.user_id) : null;
        const name = owner?.name ?? ticket.email;

        let status: TicketStatus = ticket.status;
        if (reply !== '') {
            status = await repositoryTicket.addMessage(ticket.ticket_id, { user_id: admin.user_id, is_staff: true, body: reply });
            void ticketMails.staffReplied(ticket, name, reply);
        }
        if (isTicketStatus(body.status) && body.status !== status) {
            await repositoryTicket.setStatus(ticket.ticket_id, body.status);
            status = body.status;
            if (status === 'resuelto') {
                void ticketMails.resolved(ticket, name);
            }
        }
        logger.info(`api/ticket/admin POST code=${ticket.code} admin=${admin.user_id} reply=${reply !== ''} status=${status}`)

        const resp: IResponse<{ status: TicketStatus }> = { data: { status }, message: 'Ticket actualizado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/ticket/admin POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}
