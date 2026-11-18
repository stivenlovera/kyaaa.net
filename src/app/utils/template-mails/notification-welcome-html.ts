import { emailLayout, escapeHtml, list, paragraph, siteUrl } from './email-layout'

export const welcomeEmailHtml = (name: string): string =>
  emailLayout({
    title: 'Bienvenido',
    heading: '¡Bienvenido a kyaaa!',
    body:
      paragraph(`¡Hola, ${escapeHtml(name)}! 👋`) +
      paragraph('Nos alegra muchísimo que estés aquí: ya formas parte de nuestra comunidad. Con tu cuenta puedes:') +
      list([
        'Ver más páginas de cada pack que sin registrarte.',
        'Guardar tus packs favoritos y darles "me gusta".',
        'Comprar packs y canjear cupones; quedan guardados en "Mis compras".',
      ]) +
      paragraph('<strong>Siguiente paso:</strong> verifica tu email desde "Mi cuenta" con el botón "Verificar". Es necesario para votar por los próximos packs.'),
    button: { text: 'Explorar packs', url: siteUrl('/') },
    reason: 'Lo recibes porque se creó una cuenta en kyaaa con este email.',
  })
