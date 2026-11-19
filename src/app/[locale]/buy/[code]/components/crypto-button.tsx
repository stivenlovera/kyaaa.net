'use client'
import { IResponse } from "@/src/app/types/response";
import { routing } from "@/src/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FaBitcoin } from "react-icons/fa6";

interface CryptoButtonProps {
    code: string
}

// Pago con criptomonedas: crea el invoice en NOWPayments y abre su página de pago en otra pestaña, mientras
// esta pasa a /buy/<code>/crypto?order=<id>, que consulta el estado y muestra el mensaje de gracias al confirmarse.
// No se depende de la redirección de NOWPayments (success_url): no siempre vuelve sola al terminar.
// Si el navegador bloquea la pestaña nueva, se abre NOWPayments en esta misma pestaña (y success_url la trae de vuelta).
export const CryptoButton = ({ code }: CryptoButtonProps) => {
    const t = useTranslations('buy.cripto');
    const locale = useLocale();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const pay = async () => {
        setLoading(true);
        setError(false);
        // La pestaña se abre ya, dentro del clic: abrirla después del await la bloquean los navegadores.
        const tab = window.open('', '_blank');
        try {
            const response = await fetch("/api/buy-pack/nowpayments-invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, locale }),
            });
            const data = await response.json() as IResponse<{ url: string, order: number }>;
            if (!response.ok || !data.success) {
                throw new Error(`nowpayments-invoice ${response.status}: ${data.message}`);
            }
            if (tab === null || tab.closed) {
                window.location.assign(data.data.url);
                return;
            }
            tab.opener = null;
            tab.location.href = data.data.url;
            const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
            window.location.assign(`${prefix}/buy/${code}/crypto?order=${data.data.order}`);
        } catch (err) {
            tab?.close();
            console.error(err);
            setError(true);
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-2">
            <button type="button" className="btn-primary w-full" onClick={pay} disabled={loading}>
                <FaBitcoin aria-hidden />
                {loading ? t('abriendo') : t('boton')}
            </button>
            <p className="text-center text-xs text-neutral-400">{t('aviso')}</p>
            <p className="text-center text-xs text-neutral-400">{t('aviso_qr')}</p>
            <p className="text-center text-xs text-neutral-400">{t('aviso_exchange')}</p>
            {error && (
                <p role="alert" className="text-center text-sm text-red-500">{t('error')}</p>
            )}
        </div>
    );
}
