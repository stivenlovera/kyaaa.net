'use client'
import { IPackInfo } from "@/src/app/types/pack.types";
import { PayPalScriptProvider, ReactPayPalScriptOptions } from "@paypal/react-paypal-js"
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import moment from "moment";
import { CheckoutButton } from "./checkout-button";
import { CryptoButton } from "./crypto-button";
import { useState } from "react";
import { DialogThanks } from "./dialog-thanks";
import { useAuth } from "@/src/providers/AuthContext";

interface PayPackProps {
    pack: IPackInfo
    /** Número total de imágenes del pack. */
    totalImages: number
}

const CURRENCY = 'USD';

// Resumen de la compra con formato de factura: un solo concepto (el pack) y totales con dos decimales.
export const PayPack = ({ pack, totalImages }: PayPackProps) => {
    const t = useTranslations('buy');
    const locale = useLocale();
    const { user } = useAuth();
    const [openThanks, setThanks] = useState<boolean>(false)
    const initialOptions: ReactPayPalScriptOptions = {
        clientId: process.env.NEXT_PUBLIC_API_CLIENT_ID!, // Replace with your Sandbox/Live client ID
        currency: CURRENCY,
        intent: "capture",
    };

    // $5.00 (en) / $5,00 (es): siempre dos decimales; la moneda se indica aparte.
    const money = (value: number) => new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: CURRENCY,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));

    const price = Number(pack.price_list);
    const urlImage = pack.portada.url

    return (
        <PayPalScriptProvider options={initialOptions}>
            <div className="px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14 flex justify-center">
                <div className="card w-full md:w-2xl text-sm">
                    {/* Cabecera */}
                    {/* Móvil: título y datos apilados a la izquierda. Desde sm: datos a la derecha del título. */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-3 border-b border-neutral-700">
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold">{t('titulo')}</h1>
                            <p className="text-neutral-400">{t('subtitulo')}</p>
                        </div>
                        <dl className="min-w-0 sm:text-end">
                            <div className="flex sm:justify-end gap-2">
                                <dt className="shrink-0 text-neutral-400">{t('fecha')}:</dt>
                                <dd>{moment().format('DD/MM/YYYY')}</dd>
                            </div>
                            {user && (
                                <div className="flex sm:justify-end gap-2">
                                    <dt className="shrink-0 text-neutral-400">{t('cliente')}:</dt>
                                    <dd className="min-w-0 break-all">{user.nick}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Conceptos */}
                    <table className="w-full my-3">
                        <thead>
                            <tr className="border-b border-neutral-700 text-neutral-400 text-xs uppercase">
                                <th className="py-2 text-start font-medium">{t('descripcion')}</th>
                                <th className="py-2 px-2 text-center font-medium">{t('cantidad')}</th>
                                <th className="py-2 px-2 text-end font-medium hidden sm:table-cell">{t('precio')}</th>
                                <th className="py-2 text-end font-medium">{t('importe')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-neutral-800 align-middle">
                                <td className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 md:w-16 shrink-0">
                                            {urlImage ? (
                                                <Image
                                                    width={400}
                                                    height={500}
                                                    alt={`Preview ${pack.name}`}
                                                    fetchPriority="high"
                                                    className="w-full h-auto rounded"
                                                    unoptimized
                                                    priority
                                                    src={urlImage}
                                                />
                                            ) : (
                                                // Sin portada visible para este usuario (ver utils/pack-portada.ts).
                                                <div className="w-full aspect-[4/5] rounded bg-neutral-900" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-neutral-100 break-words">{pack.name}</div>
                                            <div className="text-xs text-neutral-400">{pack.code}</div>
                                            <div className="text-xs text-neutral-400">{t('imagenes', { count: totalImages })}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center tabular-nums">1</td>
                                <td className="py-3 px-2 text-end tabular-nums hidden sm:table-cell">{money(price)}</td>
                                <td className="py-3 text-end tabular-nums">{money(price)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Totales */}
                    <dl className="ms-auto w-full sm:w-64 grid grid-cols-2 gap-y-1 tabular-nums">
                        <dt className="text-neutral-400">{t('subtotal')}</dt>
                        <dd className="text-end">{money(price)}</dd>
                        <dt className="pt-2 mt-1 border-t border-neutral-700 font-bold text-base">{t('total')}</dt>
                        <dd className="pt-2 mt-1 border-t border-neutral-700 text-end font-bold text-base">
                            {money(price)} <span className="text-xs font-normal text-neutral-400">{CURRENCY}</span>
                        </dd>
                    </dl>

                    {/* Pago */}
                    <p className="text-xs text-neutral-400 pt-4 pb-2">{t('nota')}</p>
                    {/* Cripto primero, luego PayPal. */}
                    <div className="pb-6 mb-6 border-b border-neutral-700">
                        <CryptoButton code={pack.code} />
                    </div>
                    <div className="bg-neutral-200 rounded-sm p-2">
                        <CheckoutButton
                            code={pack.code}
                            setThanks={setThanks}
                        ></CheckoutButton>
                    </div>
                </div>
                <DialogThanks
                    open={openThanks}
                    code={pack.code}
                    image={pack.thanks_image}
                />
            </div>
        </PayPalScriptProvider>
    )
}
