import { emailLayout, escapeHtml, paragraph, tempLinkDuration, warning } from './email-layout'

export const notificationResetPasswordHtml = (name: string, url: string): string =>
  emailLayout({
    title: 'Recuperar contraseña',
    heading: 'Recupera tu contraseña',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph('Recibimos una solicitud para restablecer la contraseña de tu cuenta de kyaaa. Pulsa el botón para elegir una nueva.') +
      paragraph(`El enlace caduca en <strong>${tempLinkDuration()}</strong> y solo sirve para tu cuenta. Si caduca, puedes pedir otro desde "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión.`) +
      paragraph(`${warning('¿No lo pediste tú?')} Ignora este correo: tu contraseña no cambiará mientras nadie use el enlace. No lo compartas con nadie.`),
    button: { text: 'Restablecer contraseña', url },
    showButtonUrl: true,
    reason: 'Lo recibes porque alguien pidió recuperar la contraseña de esta cuenta.',
  })
