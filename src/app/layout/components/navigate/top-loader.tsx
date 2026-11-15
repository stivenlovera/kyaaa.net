'use client'
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Barra de progreso de navegación (debajo del nav). El App Router no expone eventos de navegación, así que:
// - empieza al hacer clic en un enlace interno (<a>, también los Link de next-intl) o al ir atrás/adelante;
// - avanza poco a poco hasta ~90 % mientras el servidor responde;
// - se completa cuando cambia la ruta o los query params (p. ej. ?page= del visor).
// Se anima tocando el estilo del elemento directamente: no hay re-render de React en cada paso.

const SAFETY_TIMEOUT_MS = 15000; // por si la navegación no llega a cambiar la URL (misma página, error…)
const START_EVENT = 'toploader:start';

/** true si ir a `href` cambia de página (otra ruta o query); false si es externo, la misma URL o solo cambia el #hash. */
export function isPageChange(href: string): boolean {
    const url = new URL(href, location.href);
    return url.origin === location.origin && (url.pathname !== location.pathname || url.search !== location.search);
}

/** Arranca la barra desde código, para navegaciones que no salen de un <a> (router.push en un botón). */
export function startTopLoader() {
    window.dispatchEvent(new Event(START_EVENT));
}

type Loader = { start: () => void, finish: () => void, dispose: () => void };

function createLoader(bar: HTMLDivElement): Loader {
    let progress = 0;
    let active = false;
    let trickle: ReturnType<typeof setInterval> | undefined;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const paint = (opacity: number, animate = true) => {
        bar.style.transitionDuration = animate ? '200ms, 300ms' : '0ms';
        bar.style.width = `${progress}%`;
        bar.style.opacity = String(opacity);
    };
    const clearAll = () => {
        clearInterval(trickle);
        timers.forEach(clearTimeout);
        timers = [];
    };

    const finish = () => {
        if (!active) return;
        active = false;
        clearAll();
        progress = 100;
        paint(1);
        // Deja ver la barra llena un instante, la desvanece y la vuelve a 0 sin animación.
        timers.push(setTimeout(() => paint(0), 250));
        timers.push(setTimeout(() => { progress = 0; paint(0, false); }, 600));
    };

    const start = () => {
        clearAll();
        active = true;
        progress = 0;
        paint(1, false);
        progress = 15;
        // Forzar un frame antes de animar desde 0.
        requestAnimationFrame(() => paint(1));
        // Cada vez avanza una fracción de lo que falta hasta el 90 %: nunca se completa sola.
        trickle = setInterval(() => {
            progress += (90 - progress) * 0.1;
            paint(1);
        }, 200);
        timers.push(setTimeout(finish, SAFETY_TIMEOUT_MS));
    };

    return { start, finish, dispose: clearAll };
}

export function TopLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const barRef = useRef<HTMLDivElement>(null);
    const loader = useRef<Loader | null>(null);
    const query = searchParams.toString();
    const routeKey = pathname + (query ? `?${query}` : '');
    // Última ruta ya pintada (la compara el manejador de atrás/adelante).
    const committedRoute = useRef(routeKey);

    useEffect(() => {
        const l = createLoader(barRef.current!);
        loader.current = l;

        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const target = event.target as Element | null;
            const anchor = target?.closest?.('a');
            if (!anchor || !anchor.href || anchor.hasAttribute('download')) return;
            // Clic en un control dentro del enlace (p. ej. los botones de favorito/me gusta de la tarjeta, que
            // cancelan la navegación y solo llaman a la API): no hay navegación, la barra no debe arrancar.
            const control = target?.closest?.('button, input, select, textarea, label, [role="button"]');
            if (control && anchor.contains(control)) return;
            if (anchor.target && anchor.target !== '_self') return;
            // Externo, mismo destino o solo cambia el #hash: no hay navegación que esperar.
            if (!isPageChange(anchor.href)) return;
            l.start();
        };
        // Atrás/adelante: Next puede haber pintado ya la ruta nueva (desde su caché) antes de este evento;
        // en ese caso el efecto de abajo ya pasó y la barra se quedaría a medias, así que se cierra al momento.
        const onPopState = () => {
            l.start();
            requestAnimationFrame(() => {
                if (committedRoute.current === location.pathname + location.search) l.finish();
            });
        };
        // Fase de captura: se ejecuta antes que el onClick de Link, que hace preventDefault.
        document.addEventListener('click', onClick, true);
        window.addEventListener('popstate', onPopState);
        window.addEventListener(START_EVENT, l.start);
        return () => {
            document.removeEventListener('click', onClick, true);
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener(START_EVENT, l.start);
            l.dispose();
        };
    }, []);

    // La ruta cambió: la navegación terminó.
    useEffect(() => {
        committedRoute.current = routeKey;
        loader.current?.finish();
    }, [routeKey]);

    return (
        <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-full h-0.75 overflow-hidden">
            <div
                ref={barRef}
                className="h-full w-0 opacity-0 bg-neutral-100 shadow-[0_0_8px_rgba(255,255,255,0.7)] transition-[width,opacity] ease-out"
            />
        </div>
    );
}
