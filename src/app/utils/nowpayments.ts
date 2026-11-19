// Cliente de la API de NOWPayments (solo servidor). Pagos con criptomonedas mediante la página de pago
// alojada ("invoice"): el comprador elige la moneda en nowpayments.io y el resultado llega por webhook (IPN).
//
// Variables de servidor (CapRover):
// - NOWPAYMENTS_API_URL: https://api.nowpayments.io (sin /v1).
// - NOWPAYMENTS_API_KEY: cabecera x-api-key.
// - NOWPAYMENTS_IPN_SECRET: firma de los webhooks (cabecera x-nowpayments-sig).
// - NOWPAYMENTS_PARTIAL_TOLERANCE (opcional): % mínimo recibido para aceptar un `partially_paid`. Por defecto 95.
//
// La firma sigue el SDK oficial (NowPaymentsIO/nowpayments-sdk-nodejs, src/ipn.js): HMAC-SHA512 con el
// IPN secret sobre JSON.stringify del cuerpo con las claves ordenadas recursivamente.
import axios, { AxiosError } from 'axios';
import crypto from 'crypto';

const baseUrl = () => `${process.env.NOWPAYMENTS_API_URL ?? 'https://api.nowpayments.io'}/v1`;

/** payment_status de NOWPayments. Solo `finished` significa pagado del todo. */
export const NOWPAYMENTS_STATUS = {
    WAITING: 'waiting',
    CONFIRMING: 'confirming',
    CONFIRMED: 'confirmed',
    SENDING: 'sending',
    PARTIALLY_PAID: 'partially_paid',
    FINISHED: 'finished',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    EXPIRED: 'expired',
} as const;

export interface INowPaymentsInvoiceRequest {
    price_amount: number
    price_currency: string
    order_id: string
    order_description: string
    ipn_callback_url: string
    success_url: string
    cancel_url: string
    /** Fija el tipo de cambio mientras el pago está abierto. No se usa: sube mucho el mínimo (ver nowpayments-invoice). */
    is_fixed_rate?: boolean
}

export interface INowPaymentsInvoice {
    id: string | number
    invoice_url: string
    order_id: string
    price_amount: string | number
    price_currency: string
}

/** Cuerpo del IPN (solo los campos que se usan; el JSON completo se guarda en payment_order.content). */
export interface INowPaymentsIpn {
    payment_id: string | number
    invoice_id?: string | number | null
    payment_status: string
    order_id: string
    price_amount: number | string
    price_currency: string
    pay_amount?: number | string
    actually_paid?: number | string
    /** Lo recibido convertido a la moneda del precio (USD). */
    actually_paid_at_fiat?: number | string
    pay_currency?: string
    outcome_amount?: number | string
    outcome_currency?: string
}

/** Importes de una venta para buy_pack: bruto (lo que pagó el comprador), neto (lo que te llega) y comisión. */
export interface ISaleAmounts {
    gross: number
    net: number
    /** null si no se puede calcular (cobro en una cripto que no es un dólar estable). */
    fee: number | null
    currency: string
}

const toNumber = (value: unknown): number | null => {
    const n = Number(value);
    return value == null || value === '' || !Number.isFinite(n) ? null : n;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Monedas de cobro que valen 1 USD (usdtbsc, usdttrc20, usdcmatic…): su outcome_amount se puede tomar como USD. */
const isUsdStablecoin = (currency: unknown) => typeof currency === 'string' && /^(usdt|usdc)/i.test(currency);

/**
 * Bruto, neto y comisión de un pago de NOWPayments a partir del IPN:
 * - bruto: actually_paid_at_fiat (lo que envió el comprador en USD, con las comisiones que NOWPayments le suma);
 *   si falta, el precio del pack.
 * - neto: outcome_amount (lo que llega a la billetera de retiro), solo si se cobra en USDT/USDC; si no, neto = bruto
 *   y comisión desconocida.
 */
export function saleAmounts(payload: Partial<INowPaymentsIpn> | null, price: number, currency: string): ISaleAmounts {
    const gross = round2(toNumber(payload?.actually_paid_at_fiat) ?? price);
    const outcome = toNumber(payload?.outcome_amount);
    if (outcome !== null && currency === 'USD' && isUsdStablecoin(payload?.outcome_currency)) {
        const net = round2(Math.min(outcome, gross));
        return { gross, net, fee: round2(gross - net), currency };
    }
    return { gross, net: gross, fee: null, currency };
}

const DEFAULT_PARTIAL_TOLERANCE = 95;

/** Fracción mínima (0-1) de lo pedido que tiene que llegar para aceptar un pago parcial. */
export function partialTolerance(): number {
    const percent = Number(process.env.NOWPAYMENTS_PARTIAL_TOLERANCE);
    const value = Number.isFinite(percent) && percent > 0 && percent <= 100 ? percent : DEFAULT_PARTIAL_TOLERANCE;
    return value / 100;
}

/**
 * Fracción del precio del pack que pagó el comprador: actually_paid_at_fiat / price_amount.
 * No se mide contra pay_amount porque NOWPayments le suma sus comisiones de red (p. ej. en USDT ERC20 pidió
 * 7.48 USDT por un pack de 7 USD), y un pago de 6.85 USD quedaba en el 92 % y no se entregaba.
 * Si falta el dato en fiat, se usa actually_paid / pay_amount (en la cripto). null si no se puede calcular.
 */
export function paidRatio(payload: INowPaymentsIpn): number | null {
    const fiat = Number(payload.actually_paid_at_fiat);
    const price = Number(payload.price_amount);
    if (payload.actually_paid_at_fiat != null && Number.isFinite(fiat) && Number.isFinite(price) && price > 0) {
        return fiat / price;
    }
    const expected = Number(payload.pay_amount);
    const paid = Number(payload.actually_paid);
    if (!Number.isFinite(expected) || !Number.isFinite(paid) || expected <= 0) {
        return null;
    }
    return paid / expected;
}

/** Resumen seguro de un error de NOWPayments: sin cabeceras de la petición, que llevan la API key. */
export function describeNowPaymentsError(error: unknown) {
    if (error instanceof AxiosError) {
        return {
            message: error.message,
            status: error.response?.status,
            url: error.config?.url,
            nowpayments: error.response?.data,
        };
    }
    return { message: error instanceof Error ? error.message : String(error) };
}

export async function createInvoice(body: INowPaymentsInvoiceRequest): Promise<INowPaymentsInvoice> {
    const { data } = await axios.post<INowPaymentsInvoice>(`${baseUrl()}/invoice`, body, {
        headers: {
            'x-api-key': process.env.NOWPAYMENTS_API_KEY ?? '',
            'Content-Type': 'application/json',
        },
    });
    return data;
}

function sortObjectDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortObjectDeep);
    }
    if (value !== null && typeof value === 'object' && value.constructor === Object) {
        return Object.keys(value).sort().reduce<Record<string, unknown>>((result, key) => {
            result[key] = sortObjectDeep((value as Record<string, unknown>)[key]);
            return result;
        }, {});
    }
    return value;
}

/** Comprueba la cabecera x-nowpayments-sig de un IPN. `payload` es el cuerpo ya parseado. */
export function verifyIpnSignature(payload: unknown, signature: string | null): boolean {
    const secret = process.env.NOWPAYMENTS_IPN_SECRET?.trim();
    if (!secret || !signature) {
        return false;
    }
    const expected = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(sortObjectDeep(payload)))
        .digest('hex');
    const received = signature.trim().toLowerCase();
    if (received.length !== expected.length || !/^[0-9a-f]+$/.test(received)) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}
