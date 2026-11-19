'use client'
import { IResponse } from "@/src/app/types/response";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FaBitcoin } from "react-icons/fa6";

interface CryptoButtonProps {
    code: string
}

// Pago con criptomonedas: crea el invoice en NOWPayments y lleva al comprador a su página de pago.
// Al terminar, NOWPayments lo devuelve a /buy/<code>/crypto?order=<id>, que espera la confirmación.
export const CryptoButton = ({ code }: CryptoButtonProps) => {
    const t = useTranslations('buy.cripto');
    const locale = useLocale();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const pay = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch("/api/buy-pack/nowpayments-invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, locale }),
            });
            const data = await response.json() as IResponse<{ url: string }>;
            if (!response.ok || !data.success) {
                throw new Error(`nowpayments-invoice ${response.status}: ${data.message}`);
            }
            window.location.assign(data.data.url);
        } catch (err) {
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
