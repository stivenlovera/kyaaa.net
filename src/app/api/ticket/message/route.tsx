import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/utils/auth";
import { repositoryTicket } from "@/src/app/repositories/ticket.repository";
import { TICKET_LIMITS, TicketStatus } from "@/src/app/types/ticket.types";
import { IResponse } from "@/src/app/types/response";
import { createRateLimit } from "@/src/app/utils/rate-limit";
import { canAccessTicket } from "@/src/app/utils/ticket-access";
import { normalizeTicketCode } from "@/src/app/utils/ticket-code";
import { ticketMails } from "@/src/app/utils/ticket-mails";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { clientIp, cleanText, ticketError } from "../_utils";

const replyLimit = createRateLimit(20, 60 * 60 * 1000);

// El usuario responde en su ticket (dueño con sesión, o cualquiera con el access_token del correo).
export async function POST(request: NextRequest) {
    logger.info(`api/ticket/message POST`)
    try {
        const user = await getCurrentUser();
        const key = user !== null ? `ticket-reply:u:${user.user_id}` : `ticket-reply:ip:${clientIp(request)}`;
        if (replyLimit.isLimited(key)) {
            return ticketError('demasiados_intentos', 429);
        }
        const body: { code?: string, body?: string, token?: string } = await request.json();
        const code = normalizeTicketCode(body.code ?? '');
        const ticket = code !== null ? await repositoryTicket.findDetail(code) : null;
        // No existe o no es suyo: misma respuesta, para no revelar qué códigos existen.
        if (ticket === null || !canAccessTicket(ticket, user?.user_id ?? null, body.token)) {
            return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
        }
        if (ticket.status === 'cerrado') {
            return ticketError('cerrado', 409);
        }
        const message = cleanText(body.body);
        if (message.length < 1 || message.length > TICKET_LIMITS.body) {
            return ticketError('mensaje');
        }
        replyLimit.hit(key);
        const isOwner = user !== null && ticket.user_id === user.user_id;
        const status = await repositoryTicket.addMessage(ticket.ticket_id, {
            user_id: isOwner ? user.user_id : null,
            is_staff: false,
            body: message,
        });
        void ticketMails.userReplied(ticket, message);

        const resp: IResponse<{ status: TicketStatus }> = { data: { status }, message: 'Mensaje enviado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        logger.error(`api/ticket/message POST error=> ${jsonLog(error.message)}`)
        return ticketError('servidor', 500);
    }
}
