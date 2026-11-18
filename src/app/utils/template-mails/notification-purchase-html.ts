import { detailsBox, emailLayout, escapeHtml, EMAIL_COLOR, formatEmailDate, paragraph, siteUrl } from './email-layout'

// Correos de compra: confirmación al comprador (PayPal o cupón) y aviso de venta (SALES_EMAIL).

export interface PurchaseMailData {
  pack: { code: string, name: string, image: string | null }
  /** 'paypal': importe y transacción de PayPal; 'coupon': código canjeado. */
  method: 'paypal' | 'coupon'
  /** Importe pagado (bruto), p. ej. "4.99" (solo PayPal). */
  amount?: string
  currency?: string
  /** ID de la captura de PayPal o código del cupón (ya formateado). */
  reference: string
  date?: Date
}

const packImage = (pack: PurchaseMailData['pack']): string => pack.image
  ? `<div style="margin:0 0 16px;text-align:center;"><img src="${pack.image}" alt="${escapeHtml(pack.name)}" width="200" style="display:inline-block;max-width:200px;height:auto;border:1px solid ${EMAIL_COLOR.border};border-radius:6px;" /></div>`
  : ''

const link = (href: string, text: string) =>
  `<a href="${href}" style="color:${EMAIL_COLOR.text};text-decoration:underline;">${text}</a>`

const formatAmount = (amount: string | undefined, currency: string | undefined): string =>
  amount ? `${Number(amount).toFixed(2)} ${escapeHtml(currency ?? 'USD')}` : '—'

const rows = (data: PurchaseMailData): [string, string][] => [
  ['Pack', `${escapeHtml(data.pack.name)} (${escapeHtml(data.pack.code)})`],
  ...(data.method === 'paypal'
    ? [['Importe', formatAmount(data.amount, data.currency)], ['Pago', 'PayPal'], ['Transacción', escapeHtml(data.reference)]] as [string, string][]
    : [['Cupón', escapeHtml(data.reference)]] as [string, string][]),
  ['Fecha', formatEmailDate(data.date)],
]

/** Al comprador: compra confirmada o cupón canjeado. */
export const purchaseConfirmationHtml = (name: string, data: PurchaseMailData): string => {
  const isCoupon = data.method === 'coupon'
  const supportUrl = siteUrl(`/support?category=${isCoupon ? 'cupon' : 'pago'}&pack=${encodeURIComponent(data.pack.code)}`)
  return emailLayout({
    title: isCoupon ? 'Cupón canjeado' : 'Compra confirmada',
    heading: isCoupon ? '¡Cupón canjeado!' : '¡Gracias por tu compra!',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph(isCoupon
        ? `Canjeaste tu cupón y el pack <strong>${escapeHtml(data.pack.name)}</strong> ya está en tu cuenta.`
        : `Tu pago se completó y el pack <strong>${escapeHtml(data.pack.name)}</strong> ya está en tu cuenta.`) +
      packImage(data.pack) +
      detailsBox(rows(data)) +
      paragraph('Puedes ver todas sus páginas y descargarlo completo desde la página del pack. Lo encontrarás siempre en ' + link(siteUrl('/my-purchases'), '"Mis compras"') + '.') +
      paragraph(`¿Algún problema con ${isCoupon ? 'el canje' : 'tu compra'}? ${link(supportUrl, 'Repórtalo aquí')} y te ayudaremos.`) +
      (isCoupon ? '' : paragraph(`<span style="color:${EMAIL_COLOR.muted};font-size:12px;">PayPal te envía además su propio recibo del pago.</span>`)),
    button: { text: 'Ver pack y descargar', url: siteUrl(`/pack/${data.pack.code}`) },
    reason: isCoupon
      ? 'Lo recibes porque canjeaste un cupón en kyaaa.'
      : 'Lo recibes porque hiciste una compra en kyaaa.',
  })
}

/** Al staff (SALES_EMAIL): nueva venta o canje. */
export const saleStaffHtml = (buyer: { nick: string, email: string }, data: PurchaseMailData): string =>
  emailLayout({
    title: data.method === 'coupon' ? 'Cupón canjeado' : 'Nueva venta',
    heading: data.method === 'coupon' ? 'Se canjeó un cupón' : 'Nueva venta',
    body:
      paragraph(`Comprador: <strong>${escapeHtml(buyer.nick)}</strong> (${escapeHtml(buyer.email)})`) +
      detailsBox(rows(data)),
    button: { text: 'Ver pack', url: siteUrl(`/pack/${data.pack.code}`) },
    reason: 'Lo recibes porque este email está configurado como SALES_EMAIL.',
  })
