// Valores comunes de los metadatos (SEO / Open Graph). El layout de [locale] los usa como base de todas
// las páginas: con solo `title` y `description` en una página, Next rellena og:title/og:description con
// ellos y mantiene la imagen y el siteName del layout. Si una página define su propio `openGraph`, este
// reemplaza ENTERO al del layout (Next no mezcla sus campos): hay que volver a pasar siteName e imagen.

/** Base para resolver las URLs relativas de los metadatos (og:image, canonical…). */
export const SITE_URL = process.env.SITE_URL ?? 'https://kyaaa.net';

export const SITE_NAME = 'kyaaa';

/** Imagen por defecto al compartir un enlace del sitio (public/img/marca-agua.png, 3800x900). */
export const DEFAULT_OG_IMAGE = {
    url: '/img/marca-agua.png',
    width: 3800,
    height: 900,
    alt: SITE_NAME,
};
