import { detailsBox, emailLayout, escapeHtml, formatEmailDate, paragraph, siteUrl, warning } from './email-layout'

export type PasswordChangeVia = 'account' | 'reset'

interface NotificationUpdatePasswordParams {
  name: string
  email: string
  /** Desde "Mi cuenta" (sabía la contraseña actual) o con el enlace de recuperación. */
  via: PasswordChangeVia
  date?: Date
}

const VIA_TEXT: Record<PasswordChangeVia, string> = {
  account: 'Desde "Mi cuenta"',
  reset: 'Con un enlace de recuperación de contraseña',
}

export const notificationUpdatePasswordHtml = ({ name, email, via, date = new Date() }: NotificationUpdatePasswordParams): string =>
  emailLayout({
    title: 'Contraseña actualizada',
    heading: 'Tu contraseña se ha actualizado',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph('Te confirmamos que la contraseña de tu cuenta de kyaaa se cambió correctamente. A partir de ahora tendrás que usar la nueva contraseña para iniciar sesión.') +
      detailsBox([
        ['Cuenta', escapeHtml(email)],
        ['Fecha', formatEmailDate(date)],
        ['Cómo', VIA_TEXT[via]],
      ]) +
      paragraph('<strong>¿Fuiste tú?</strong> No tienes que hacer nada más.') +
      paragraph(`${warning('¿No fuiste tú?')} Alguien podría tener acceso a tu cuenta. Entra en kyaaa, usa "¿Olvidaste tu contraseña?" para crear una nueva y revisa en "Mi cuenta" que tu email siga siendo el correcto.`),
    button: { text: 'Ir a kyaaa', url: siteUrl('/login') },
    reason: 'Lo recibes porque es un aviso de seguridad de tu cuenta.',
  })
