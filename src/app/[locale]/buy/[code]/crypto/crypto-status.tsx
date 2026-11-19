'use client'
import { IResponse } from "@/src/app/types/response";
import { routing } from "@/src/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DialogThanks } from "../components/dialog-thanks";

interface CryptoStatusProps {
    orderId: number
    code: string
    name: string
    thanksImage?: string | null
}

interface IStatus {
    status: string
    completed: boolean
}

const POLL_MS = 10_000;
const FAILED = ['failed', 'expired', 'refunded', 'amount_mismatch'];

// Consulta el estado del pago cada 10 s hasta que se completa o falla.
export const CryptoStatus = ({ orderId, code, name, thanksImage }: CryptoStatusProps) => {
    const t = useTranslations('buy.cripto');
    // Rutas dinámicas: next/link con el prefijo del idioma a mano (como DialogThanks).
    const locale = useLocale();
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    const [state, setState] = useState<IStatus | null>(null);
    const [notFound, setNotFound] = useState(false);

    // Un pago parcial sigue consultándose: si el comprador envía la diferencia pasa a `finished`.
    const done = state !== null && (state.completed || FAILED.includes(state.status));
    const partial = state !== null && !state.completed && state.status === 'partially_paid';

    useEffect(() => {
        if (done || notFound) {
            return;
        }
        let cancelled = false;
        const check = async () => {
            try {
                const response = await fetch(`/api/buy-pack/nowpayments-status?order=${orderId}`, { cache: 'no-store' });
                if (response.status === 404) {
                    if (!cancelled) setNotFound(true);
                    return;
                }
                const data = await response.json() as IResponse<IStatus>;
                if (!cancelled && data.success) setState(data.data);
            } catch (error) {
                // Sin conexión un momento: se reintenta en el siguiente ciclo.
                console.error(error);
            }
        };
        check();
        const timer = setInterval(check, POLL_MS);
        return () => { cancelled = true; clearInterval(timer); };
    }, [orderId, done, notFound]);

    const support = `${prefix}/support?category=pago&pack=${encodeURIComponent(code)}`;

    return (
        <div className="px-2 py-6 md:py-14 flex justify-center">
            <div className="card w-full md:w-xl text-sm grid gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">{t('titulo')}</h1>
                    <p className="text-neutral-400">{name} · {code}</p>
                </div>

                {notFound && <p role="alert" className="text-red-500">{t('no_encontrado')}</p>}

                {!notFound && state?.completed && <p className="text-green-500 font-bold">{t('completado')}</p>}

                {!notFound && partial && (
                    <p role="alert" className="text-red-500">{t('parcial')}</p>
                )}

                {!notFound && state !== null && !state.completed && FAILED.includes(state.status) && (
                    <p role="alert" className="text-red-500">{t('fallido', { status: state.status })}</p>
                )}

                {!notFound && !done && !partial && (
                    <div className="grid gap-2" aria-live="polite">
                        <div className="h-1 w-full overflow-hidden rounded bg-neutral-800">
                            <div className="h-full w-1/3 animate-pulse rounded bg-neutral-300" />
                        </div>
                        {/* Aún no ha pagado: el pago se hace en la pestaña de NOWPayments. */}
                        <p>{state === null || ['created', 'waiting'].includes(state.status) ? t('pendiente_pago') : t('esperando')}</p>
                        {state && <p className="text-xs text-neutral-400">{t('estado', { status: state.status })}</p>}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <Link href={`${prefix}/pack/${code}`} className="btn-primary">{t('volver')}</Link>
                    {(notFound || partial || (done && !state?.completed)) && (
                        <Link href={support} className="btn-primary">{t('reportar')}</Link>
                    )}
                </div>
            </div>
            <DialogThanks open={state?.completed === true} code={code} image={thanksImage} />
        </div>
    );
}
