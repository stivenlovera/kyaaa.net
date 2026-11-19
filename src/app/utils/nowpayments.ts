// Cliente de la API de NOWPayments (solo servidor). Pagos con criptomonedas mediante la página de pago
// alojada ("invoice"): el comprador elige la moneda en nowpayments.io y el resultado llega por webhook (IPN).
//
// Variables de servidor (CapRover):
// - NOWPAYMENTS_API_URL: https://api.nowpayments.io (sin /v1).
// - NOWPAYMENTS_API_KEY: cabecera x-api-key.
// - NOWPAYMENTS_IPN_SECRET: firma de los webhooks (cabecera x-nowpayments-sig).
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
    pay_currency?: string
    outcome_amount?: number | string
    outcome_currency?: string
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
