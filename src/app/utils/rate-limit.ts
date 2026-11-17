// Límite de intentos en memoria (ventana deslizante). Vale para una sola instancia de la app, que es
// como se despliega en CapRover; con varias réplicas cada una llevaría su propia cuenta.
const hits = new Map<string, number[]>();

export function createRateLimit(max: number, windowMs: number) {
    const recent = (key: string, now: number) => (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    return {
        /** true si `key` ya agotó sus intentos en la ventana. */
        isLimited(key: string): boolean {
            return recent(key, Date.now()).length >= max;
        },
        /** Anota un intento (p. ej. un código incorrecto). */
        hit(key: string): void {
            const now = Date.now();
            hits.set(key, [...recent(key, now), now]);
        },
    };
}
