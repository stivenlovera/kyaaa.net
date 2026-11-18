import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../app/utils/auth";
import logger, { jsonLog } from "../app/utils/logger";
import { routing } from "../i18n/routing";
import { LOGIN_NEXT_PARAM, loginHref, safeNextPath } from "../app/utils/login-redirect";

function splitLocale(pathname: string): { locale: string | null, path: string } {
  const [, first, ...rest] = pathname.split('/');
  if ((routing.locales as readonly string[]).includes(first)) {
    return { locale: first, path: '/' + rest.join('/') };
  }
  return { locale: null, path: pathname };
}

// '/my-account' y '/my-account/...' sí; '/my-accountX' no.
function matchesPath(path: string, base: string) {
  return path === base || path.startsWith(base + '/');
}

export async function withAuth(request: NextRequest) {
  logger.info(`proxy/withAuth pathname ${jsonLog(request.nextUrl.pathname)}`)
  logger.info(`proxy/withAuth url ${jsonLog(request.url)}`)
  const token = request.cookies.get('accessToken')?.value;
  // Las rutas pueden llegar con prefijo de idioma (/es/my-account, /en/login): se compara sin él
  // y los redirects conservan el idioma de la petición.
  const { locale, path } = splitLocale(request.nextUrl.pathname);
  const toLocalized = (target: string) => new URL(locale ? `/${locale}${target === '/' ? '' : target}` : target, request.url);

  // Protected routes
  const protectedPaths = ['/my-purchases', '/favorites', '/my-account', '/my-tickets'];
  const isProtectedPath = protectedPaths.some(p => matchesPath(path, p));

  // Public routes that should redirect if authenticated
  const noProtectedPaths = ['/login', '/register'];
  const isAuthPath = noProtectedPaths.some(p => matchesPath(path, p));

  // Sin sesión en una ruta protegida: a /login con `?next=` para volver aquí tras iniciar sesión.
  const toLogin = () => NextResponse.redirect(new URL(
    loginHref(request.nextUrl.pathname + request.nextUrl.search, { loginPath: toLocalized('/login').pathname }),
    request.url,
  ));

  if (isProtectedPath) {
    if (!token) {
      return toLogin();
    }
    const user = await verifyAccessToken(token);
    logger.info(`proxy/withAuth user ${user}`)
    if (user === null) {
      return toLogin();
    }
  }
  if (isAuthPath && token) {
    const user = await verifyAccessToken(token);
    if (user) {
      // Ya hay sesión: a la página de `?next=` (si es segura) o a la portada.
      const next = safeNextPath(request.nextUrl.searchParams.get(LOGIN_NEXT_PARAM));
      return NextResponse.redirect(next === '/' ? toLocalized('/') : new URL(next, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/login',
    '/register',
    ['/((?!api|_next/static|_next/image|favicon.ico).*)']
  ],
};