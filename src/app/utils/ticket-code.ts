import { COUPON_ALPHABET } from "./coupon-code";

// Código público de un ticket: 6 caracteres del alfabeto de los cupones (sin 0/O/1/I), guardado sin
// prefijo y mostrado como TCK-XXXXXX. No es secreto: el acceso sin sesión usa `access_token`.

export const TICKET_CODE_LENGTH = 6;
export const TICKET_PREFIX = 'TCK';

export const formatTicketCode = (code: string): string => `${TICKET_PREFIX}-${code}`;

/** Acepta 'tck-abc234', 'TCK-ABC234' o 'ABC234'; devuelve el código guardado o null si no es válido. */
export function normalizeTicketCode(value: string): string | null {
    const clean = value.toUpperCase().replace(/[\s-]/g, '');
    const code = clean.startsWith(TICKET_PREFIX) ? clean.slice(TICKET_PREFIX.length) : clean;
    if (code.length !== TICKET_CODE_LENGTH || [...code].some((c) => !COUPON_ALPHABET.includes(c))) {
        return null;
    }
    return code;
}
