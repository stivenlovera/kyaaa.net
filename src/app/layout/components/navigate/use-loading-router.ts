'use client'
import { useRouter as useNextRouter } from 'next/navigation';
import { useMemo } from 'react';
import { isPageChange, startTopLoader } from './top-loader';

/**
 * `useRouter` de `next/navigation` que además enciende la barra de carga en `push` y `replace`.
 * Úsalo para navegar desde botones o tras enviar un formulario: la barra solo detecta sola los clics en <a>.
 */
export function useRouter() {
    const router = useNextRouter();
    return useMemo(() => ({
        ...router,
        push: (...args: Parameters<typeof router.push>) => {
            if (isPageChange(args[0])) startTopLoader();
            router.push(...args);
        },
        replace: (...args: Parameters<typeof router.replace>) => {
            if (isPageChange(args[0])) startTopLoader();
            router.replace(...args);
        },
    }), [router]);
}
