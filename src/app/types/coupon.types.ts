export type CouponStatus = 'free' | 'redeemed' | 'expired';

export interface IAdminCoupon {
    coupon_id: number
    /** Código guardado (sin prefijo ni guiones); se muestra con formatCouponCode. */
    code: string
    pack: { pack_id: number, name: string, code: string }
    expires_at: Date
    note: string | null
    user: { user_id: number, nick: string, email: string } | null
    redeemed_at: Date | null
    create_at: Date
}

export interface IAdminCouponPage {
    coupons: IAdminCoupon[]
    total: number
}

export interface IFormCouponGenerate {
    pack_id: number
    quantity: number
    /** Último día válido, 'YYYY-MM-DD' (el código vale hasta el final de ese día). */
    expires_at: string
    note?: string
}

/** Resultado de un canje. Los errores son claves de traducción (canjear.error.*). */
export type RedeemResult =
    | { ok: true, pack: { code: string, name: string } }
    | { ok: false, error: 'invalido' | 'usado' | 'caducado' | 'ya_tienes' }
