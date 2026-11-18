import { emailLayout, escapeHtml, list, paragraph, siteUrl } from './email-layout'

// Aviso al email NUEVO cuando el usuario cambia el email de su cuenta.
export const notificationNewEmailHtml = (name: string): string =>
  emailLayout({
    title: 'Nuevo email registrado',
    heading: 'Tu nuevo email está registrado',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}!`) +
      paragraph('Este email es ahora el de tu cuenta de kyaaa: úsalo para iniciar sesión. Aquí recibirás los avisos de la cuenta.') +
      paragraph('<strong>Falta un paso:</strong> verifícalo desde "Mi cuenta" con el botón "Verificar". Con el email verificado podrás:') +
      list([
        'Votar por los próximos packs.',
        'Confirmar que la cuenta es tuya y recibir aquí sus avisos de seguridad.',
      ]),
    button: { text: 'Ir a Mi cuenta', url: siteUrl('/my-account') },
    reason: 'Lo recibes porque este email se vinculó a una cuenta de kyaaa.',
  })
