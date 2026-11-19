// Formato de precios en la web: moneda con dos decimales según el idioma (7,00 $ en es, $7.00 en en).
// Usarlo en todo precio visible (botón comprar de /pack, resumen de /buy…) para que coincidan.

export const PRICE_CURRENCY = 'USD';

export const formatPrice = (value: number, locale: string, currency: string = PRICE_CURRENCY): string =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));
