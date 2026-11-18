// Plantilla común de los correos: mismos colores que la web (tema oscuro, escala neutral de Tailwind),
// letra de 14px y botón con el aspecto de btn-primary. Estilos en línea y maquetado con tablas porque
// muchos clientes de correo (Gmail, Outlook) ignoran <style> y flexbox.

export const EMAIL_COLOR = {
  background: '#171717', // neutral-900 (fondo de la web)
  card: '#262626',       // neutral-800
  border: '#404040',     // neutral-700
  button: '#525252',     // neutral-600 (borde de btn-primary)
  text: '#f5f5f5',       // neutral-100
  muted: '#a3a3a3',      // neutral-400
  warning: '#eab308',    // yellow-500
}

const LOGO_URL = 'https://static.kyaaa.net/system/logo-email-transparente.png'

/** Escapa datos del usuario (nombre, email…) antes de meterlos en el HTML. */
export const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const siteUrl = (path = ''): string => `${process.env.URL_BASE ?? ''}${path}`

/** Duración de los enlaces temporales (VERIFIED_COOKIES_EXPIRES_IN, p. ej. "30m") en texto: "30 minutos". */
export const tempLinkDuration = (): string => {
  const match = /^(\d+)\s*([smhd])$/.exec(process.env.VERIFIED_COOKIES_EXPIRES_IN ?? '')
  if (!match) {
    return 'poco tiempo'
  }
  const n = Number(match[1])
  const units: Record<string, [string, string]> = {
    s: ['segundo', 'segundos'], m: ['minuto', 'minutos'], h: ['hora', 'horas'], d: ['día', 'días'],
  }
  const [one, many] = units[match[2]]
  return `${n} ${n === 1 ? one : many}`
}

export const paragraph = (html: string): string => `<p style="margin:0 0 12px;">${html}</p>`

/** Texto resaltado en amarillo para avisos de seguridad ("¿No fuiste tú?"). */
export const warning = (html: string): string => `<strong style="color:${EMAIL_COLOR.warning};">${html}</strong>`

/** Recuadro con pares etiqueta / valor (los valores ya deben venir escapados). */
export const detailsBox = (rows: [string, string][]): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 16px;background-color:${EMAIL_COLOR.background};border:1px solid ${EMAIL_COLOR.border};border-radius:6px;">
  <tr>
    <td style="padding:12px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.map(([label, value]) => `
        <tr>
          <td style="padding:4px 0;color:${EMAIL_COLOR.muted};font-size:13px;width:110px;vertical-align:top;">${label}</td>
          <td style="padding:4px 0;color:${EMAIL_COLOR.text};font-size:13px;word-break:break-all;">${value}</td>
        </tr>`).join('')}
      </table>
    </td>
  </tr>
</table>`

/** Lista con viñetas. */
export const list = (items: string[]): string => `
<ul style="margin:0 0 12px;padding-left:20px;">${items.map((item) => `<li style="margin:0 0 4px;">${item}</li>`).join('')}</ul>`

/** Fecha y hora en UTC, p. ej. "18 de noviembre de 2026, 14:30 (UTC)". */
export const formatEmailDate = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat('es', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' (UTC)'

interface EmailLayoutParams {
  /** <title> del documento. */
  title: string
  heading: string
  /** HTML del cuerpo (ya escapado). */
  body: string
  button?: { text: string, url: string }
  /** Para enlaces con token: se muestra la URL en texto por si el botón no funciona. */
  showButtonUrl?: boolean
  /** Motivo por el que se recibe el correo, en el pie. */
  reason: string
}

export const emailLayout = ({ title, heading, body, button, showButtonUrl = false, reason }: EmailLayoutParams): string => `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <title>${title} - kyaaa</title>
  </head>
  <body style="margin:0;padding:0;background-color:${EMAIL_COLOR.background};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL_COLOR.background};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:${EMAIL_COLOR.card};border:1px solid ${EMAIL_COLOR.border};border-radius:8px;font-family:Arial,Helvetica,sans-serif;color:${EMAIL_COLOR.text};font-size:14px;line-height:1.5;">
            <tr>
              <td align="center" style="padding:24px 24px 8px;">
                <img src="${LOGO_URL}" alt="kyaaa" width="160" style="display:block;max-width:160px;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 4px;">
                <h1 style="margin:0 0 12px;font-size:18px;font-weight:bold;color:${EMAIL_COLOR.text};">${heading}</h1>
                ${body}
              </td>
            </tr>${button ? `
            <tr>
              <td align="center" style="padding:4px 24px 24px;">
                <a href="${button.url}" style="display:inline-block;padding:10px 20px;background-color:${EMAIL_COLOR.card};border:2px solid ${EMAIL_COLOR.button};border-radius:6px;color:${EMAIL_COLOR.text};font-size:14px;font-weight:bold;text-decoration:none;">${button.text}</a>${showButtonUrl ? `
                <p style="margin:12px 0 0;color:${EMAIL_COLOR.muted};font-size:12px;text-align:left;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br /><a href="${button.url}" style="color:${EMAIL_COLOR.muted};word-break:break-all;">${button.url}</a></p>` : ''}
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding:16px 24px;border-top:1px solid ${EMAIL_COLOR.border};color:${EMAIL_COLOR.muted};font-size:12px;">
                Este es un correo automático, por favor no lo respondas. ${reason}<br />
                © ${new Date().getFullYear()} kyaaa
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
