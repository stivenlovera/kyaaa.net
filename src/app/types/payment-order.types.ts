// Pagos con cripto (tabla payment_order) para /admin/crypto.

/** Filtros de la lista: parciales sin entregar (por defecto), todos los sin entregar, entregados o todos. */
export const ADMIN_PAYMENT_FILTERS = ['partial', 'open', 'completed', 'all'] as const;
export type AdminPaymentFilter = typeof ADMIN_PAYMENT_FILTERS[number];

export const isAdminPaymentFilter = (value: unknown): value is AdminPaymentFilter =>
    typeof value === 'string' && (ADMIN_PAYMENT_FILTERS as readonly string[]).includes(value);

export interface IAdminPaymentOrder {
    payment_order_id: number
    user: { user_id: number, nick: string, email: string }
    pack: { pack_id: number, code: string, name: string }
    /** Precio del pack al crear el pago. */
    amount: number
    currency: string
    /** Último payment_status de NOWPayments ('created' si nunca llegó un aviso). */
    status: string
    payment_id: string | null
    /** Datos del último aviso (null si no llegó ninguno). */
    paid: {
        /** Lo recibido convertido a la moneda del precio. */
        fiat: number | null
        /** Lo recibido en cripto y lo que se pedía. */
        crypto: number | null
        expected: number | null
        pay_currency: string | null
    } | null
    completed_at: Date | null
    create_at: Date
}

export interface IAdminPaymentPage {
    orders: IAdminPaymentOrder[]
    total: number
}
