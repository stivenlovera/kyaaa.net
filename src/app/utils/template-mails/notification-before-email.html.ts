import { detailsBox, emailLayout, escapeHtml, formatEmailDate, paragraph, siteUrl, warning } from './email-layout'

// Aviso al email ANTERIOR cuando el usuario cambia el email de su cuenta.
export const notificationBeforeEmailHtml = (name: string, new_email: string, date: Date = new Date()): string =>
  emailLayout({
    title: 'Email modificado',
    heading: 'El email de tu cuenta ha cambiado',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph('El email de tu cuenta de kyaaa se cambió. Desde ahora este correo ya no está vinculado a la cuenta: para iniciar sesión y recibir avisos se usará el nuevo email.') +
      detailsBox([
        ['Nuevo email', escapeHtml(new_email)],
        ['Fecha', formatEmailDate(date)],
      ]) +
      paragraph('<strong>¿Fuiste tú?</strong> No tienes que hacer nada más. Recuerda verificar el nuevo email desde "Mi cuenta".') +
      paragraph(`${warning('¿No fuiste tú?')} Alguien podría tener acceso a tu cuenta. Ponte en contacto con nosotros cuanto antes desde la web para recuperarla.`),
    button: { text: 'Ir a kyaaa', url: siteUrl('/') },
    reason: 'Lo recibes porque es un aviso de seguridad de la cuenta que estaba vinculada a este email.',
  })
