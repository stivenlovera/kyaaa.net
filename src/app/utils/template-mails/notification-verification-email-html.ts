import { emailLayout, escapeHtml, list, paragraph, tempLinkDuration } from './email-layout'

export const verifiedEmailHtml = (name: string, url: string): string =>
  emailLayout({
    title: 'Verifica tu email',
    heading: 'Verifica tu email',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph('Pulsa el botón para confirmar que este email es tuyo. Con el email verificado podrás:') +
      list([
        'Votar por los próximos packs.',
        'Confirmar que la cuenta es tuya y recibir aquí sus avisos de seguridad.',
      ]) +
      paragraph(`El enlace caduca en <strong>${tempLinkDuration()}</strong>. Si caduca, pide otro desde "Mi cuenta" con el botón "Verificar".`) +
      paragraph('Si no pediste esta verificación, ignora este correo.'),
    button: { text: 'Verificar email', url },
    showButtonUrl: true,
    reason: 'Lo recibes porque se pidió verificar este email en kyaaa.',
  })
