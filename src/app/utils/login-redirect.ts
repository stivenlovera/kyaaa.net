import { routing } from "@/src/i18n/routing";

// Vuelta a la página de origen tras iniciar sesión: el enlace a /login lleva `?next=<ruta>` y, al
// entrar, el formulario (o el proxy, si ya hay sesión) navega a esa ruta en lugar de a '/'.
// Se usa en cliente, en el servidor y en el proxy: no importa nada de servidor.

export const LOGIN_NEXT_PARAM = 'next';

const AUTH_PATHS = ['/login', '/register'];

/**
 * Devuelve `value` si es una ruta interna segura a la que volver; si no, '/'.
 * Evita redirecciones abiertas ("//otro-sitio.com", "https://…", "/\\otro") y volver a /login o /register.
 */
export function safeNextPath(value: string | null | undefined): string {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
        return '/';
    }
    const pathname = value.split(/[?#]/)[0];
    const [, first, ...rest] = pathname.split('/');
    const path = (routing.locales as readonly string[]).includes(first) ? '/' + rest.join('/') : pathname;
    if (AUTH_PATHS.some((p) => path === p || path.startsWith(p + '/'))) {
        return '/';
    }
    return value;
}

/** Abre /login en la pestaña de registro (`?tab=register`). */
export const LOGIN_TAB_PARAM = 'tab';
export const LOGIN_TAB_REGISTER = 'register';

/** Enlace a /login (o `loginPath`) que vuelve a `next` tras iniciar sesión o registrarse. */
export function loginHref(next: string, options: { loginPath?: string, register?: boolean } = {}): string {
    const { loginPath = '/login', register = false } = options;
    const params = new URLSearchParams();
    const target = safeNextPath(next);
    if (target !== '/') {
        params.set(LOGIN_NEXT_PARAM, target);
    }
    if (register) {
        params.set(LOGIN_TAB_PARAM, LOGIN_TAB_REGISTER);
    }
    const query = params.toString();
    return query ? `${loginPath}?${query}` : loginPath;
}
