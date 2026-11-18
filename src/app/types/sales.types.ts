// Ventas para /admin/sales (tabla buy_pack). Importes en número con 2 decimales.

export const SALE_METHODS = ['paypal', 'coupon'] as const;
export type SaleMethod = typeof SALE_METHODS[number];

export const isSaleMethod = (value: unknown): value is SaleMethod =>
    typeof value === 'string' && (SALE_METHODS as readonly string[]).includes(value);

export interface ISalesFilter {
    /** Desde (incluido). */
    from?: Date
    /** Hasta (excluido): el día siguiente al último día elegido. */
    to?: Date
    pack_id?: number
    method?: SaleMethod
}

export interface ISale {
    pack: { pack_id: number, code: string, name: string }
    user: { user_id: number, nick: string, email: string }
    method: SaleMethod
    /** Lo que pagó el comprador. */
    gross: number
    /** Comisión de PayPal. */
    fee: number
    /** Lo que queda (buy_pack.price). */
    net: number
    currency: string
    /** ID de la captura de PayPal o código del cupón. */
    transaction: string
    create_at: Date
}

export interface ISalesPage {
    sales: ISale[]
    total: number
}

export interface ISalesSummary {
    /** Ventas con PayPal. */
    sales: number
    /** Cupones canjeados. */
    coupons: number
    gross: number
    fee: number
    net: number
}

export interface ITopPack {
    pack: { pack_id: number, code: string, name: string }
    sales: number
    gross: number
}
