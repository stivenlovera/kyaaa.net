import { timingSafeEqual } from "crypto";

/**
 * ¿Puede ver y responder el ticket quien llama? Sí si es su dueño (sesión) o si trae el `access_token`
 * del enlace del correo (único acceso de un ticket anónimo). El staff entra por /admin/ticket.
 */
export function canAccessTicket(
    ticket: { user_id: number | null, access_token: string },
    user_id: number | null,
    token: string | null | undefined,
): boolean {
    if (user_id !== null && ticket.user_id === user_id) {
        return true;
    }
    if (!token) {
        return false;
    }
    const a = Buffer.from(token);
    const b = Buffer.from(ticket.access_token);
    return a.length === b.length && timingSafeEqual(a, b);
}
