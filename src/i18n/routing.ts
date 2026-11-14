import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  // El español se sirve sin prefijo (/pack/x en lugar de /es/pack/x): evita un redirect 307 en cada
  // enlace interno sin locale. Las rutas con /es siguen funcionando (el matcher de proxy.ts las excluye).
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/pathnames': {
      es: '/pfadnamen'
    }
  }
});