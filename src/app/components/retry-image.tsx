'use client'
import Image, { ImageProps } from "next/image"
import { useEffect, useRef, useState } from "react"

// Esperas antes de cada reintento. Si el almacenamiento (Contabo) responde 429/403 de forma puntual,
// la imagen se vuelve a pedir sola en lugar de quedarse rota hasta que el usuario recargue.
const RETRY_DELAYS_MS = [1000, 3000, 8000];

/**
 * `next/image` que reintenta la carga si falla. Mismas props que `Image`.
 *
 * El reintento cambia solo el fragmento de la URL (`#retry-N`): el navegador lo trata como un src nuevo y
 * vuelve a pedir la imagen, pero el fragmento no llega al servidor, así que no rompe las URLs firmadas ni
 * cambia la key de caché de Cloudflare. Las respuestas 403/429 no se guardan en la caché HTTP, por lo que
 * el reintento va de verdad a la red.
 */
export function RetryImage({ src, alt, onError, ...props }: ImageProps) {
    const baseSrc = typeof src === 'string' ? src.split('#')[0] : null;
    // El contador va ligado al src: si cambia la imagen (p. ej. en el visor), vuelve a 0 sin efectos.
    const [retry, setRetry] = useState<{ src: string | null, attempt: number }>({ src: baseSrc, attempt: 0 });
    const attempt = retry.src === baseSrc ? retry.attempt : 0;
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <Image
            {...props}
            alt={alt}
            src={baseSrc !== null && attempt > 0 ? `${baseSrc}#retry-${attempt}` : src}
            onError={(event) => {
                if (baseSrc !== null && attempt < RETRY_DELAYS_MS.length) {
                    clearTimeout(timer.current);
                    timer.current = setTimeout(() => setRetry({ src: baseSrc, attempt: attempt + 1 }), RETRY_DELAYS_MS[attempt]);
                } else {
                    onError?.(event);
                }
            }}
        />
    );
}
