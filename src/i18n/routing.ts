import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  // El español se sirve sin prefijo (/pack/x en lugar de /es/pack/x): evita un redirect 307 en cada
  // enlace interno sin locale. Las rutas con /es siguen funcionando (el matcher de proxy.ts las excluye).
  localePrefix: 'as-needed',
  // Sin detección por Accept-Language/cookie: '/' es siempre español. Así el HTML de un anónimo es el
  // mismo para todos y Cloudflare puede cachearlo (si no, cachearía el redirect a /en para todo el mundo).
  localeDetection: false,
  // La cookie NEXT_LOCALE solo sirve para la detección; además un Set-Cookie impide que Cloudflare cachee.
  localeCookie: false,
  pathnames: {
    '/': '/',
    '/pathnames': {
      es: '/pfadnamen'
    }
  }
});