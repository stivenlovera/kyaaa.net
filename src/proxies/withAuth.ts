import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../app/utils/auth";
import logger, { jsonLog } from "../app/utils/logger";
import { routing } from "../i18n/routing";

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
  const protectedPaths = ['/my-purchases', '/favorites', '/my-account'];
  const isProtectedPath = protectedPaths.some(p => matchesPath(path, p));

  // Public routes that should redirect if authenticated
  const noProtectedPaths = ['/login', '/register'];
  const isAuthPath = noProtectedPaths.some(p => matchesPath(path, p));

  if (isProtectedPath) {
    if (!token) {
      return NextResponse.redirect(toLocalized('/login'));
    }
    const user = await verifyAccessToken(token);
    logger.info(`proxy/withAuth user ${user}`)
    if (user === null) {
      return NextResponse.redirect(toLocalized('/login'));
    }
  }
  if (isAuthPath && token) {
    const user = await verifyAccessToken(token);
    if (user) {
      return NextResponse.redirect(toLocalized('/'));
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