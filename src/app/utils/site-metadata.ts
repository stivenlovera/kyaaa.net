// Valores comunes de los metadatos (SEO / Open Graph). El layout de [locale] los usa como base de todas
// las páginas: con solo `title` y `description` en una página, Next rellena og:title/og:description con
// ellos y mantiene la imagen y el siteName del layout. Si una página define su propio `openGraph`, este
// reemplaza ENTERO al del layout (Next no mezcla sus campos): hay que volver a pasar siteName e imagen.

/** Base para resolver las URLs relativas de los metadatos (og:image, canonical…). */
export const SITE_URL = process.env.SITE_URL ?? 'https://kyaaa.net';

export const SITE_NAME = 'kyaaa';

/**
 * Imagen por defecto al compartir un enlace del sitio: public/img/marca-agua.png, 1200x630 (formato estándar
 * de og:image, ≈1,91:1) con el logo centrado sobre el fondo del sitio (#171717). Si se cambia el logo, hay que
 * regenerarla con ese tamaño: las redes recortan las imágenes con otra proporción.
 */
export const DEFAULT_OG_IMAGE = {
    url: '/img/marca-agua.png',
    width: 1200,
    height: 630,
    alt: SITE_NAME,
};
