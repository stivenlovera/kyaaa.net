// Formato de los códigos de cupón. Se usa en cliente y servidor: no importa nada de servidor.
//
// En la base se guarda solo el cuerpo (12 caracteres); al usuario se le muestra con prefijo y guiones:
// KYA-XXXX-XXXX-XXXX. El alfabeto omite 0/O y 1/I para que no se confundan al copiarlo a mano.
// 32^12 ≈ 1,2·10^18 combinaciones: adivinar uno válido a ciegas no es viable (y el canje limita intentos).

export const COUPON_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const COUPON_LENGTH = 12;
export const COUPON_PREFIX = 'KYA';

/** KYA-XXXX-XXXX-XXXX a partir del código guardado. */
export function formatCouponCode(code: string): string {
    return [COUPON_PREFIX, ...(code.match(/.{1,4}/g) ?? [])].join('-');
}

/**
 * Lo que escribió el usuario → el código tal como se guarda, o null si no puede ser un código.
 * Acepta minúsculas, espacios, guiones y el prefijo opcional ("kya-abcd efgh-jkmn", "ABCDEFGHJKMN"…).
 */
export function normalizeCouponCode(input: string): string | null {
    let code = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length === COUPON_PREFIX.length + COUPON_LENGTH && code.startsWith(COUPON_PREFIX)) {
        code = code.slice(COUPON_PREFIX.length);
    }
    if (code.length !== COUPON_LENGTH || [...code].some((c) => !COUPON_ALPHABET.includes(c))) {
        return null;
    }
    return code;
}

/** Máximo de códigos por lote en /admin/coupon. */
export const MAX_COUPONS_PER_BATCH = 500;
