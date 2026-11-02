# CLAUDE.md

Este archivo ofrece orientación a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Comandos

- `npm run dev` — servidor de desarrollo en el puerto 3000
- `npm run build` / `npm start` — build de producción; `start` escucha en el puerto **80**
- `npm run lint` — ESLint (configuración flat en `eslint.config.mjs`)
- `npx prisma generate` — regenera el cliente de Prisma en `generated/prisma` (ignorado por git; hay que ejecutarlo después de `npm ci` y tras cualquier cambio en `prisma/schema.prisma`; el Dockerfile lo ejecuta antes de `next build`)

No hay suite de tests. No hay migraciones de Prisma en el repositorio; `data-base/schema.sql` y `prisma/schema.prisma` describen el esquema de MariaDB (solo estructura; los datos de ejemplo están en `data-base/population.sql`, que se ejecuta después). Los cambios de esquema van además como scripts en `data-base/migrations/`.

El despliegue es CI/CD con GitHub Actions (`.github/workflows/ci-cd.yml`): en cada PR y push a `master` corre lint + `tsc --noEmit` y construye la imagen; en push a `master` la publica en GHCR (`ghcr.io/stivenlovera/ia-kyaaa-net:<sha>`) y la despliega en CapRover con `caprover/deploy-from-github`. La imagen usa `output: 'standalone'` (`node server.js`) y no contiene secretos: solo las `NEXT_PUBLIC_*` se pasan como build args (desde las *Variables* del repo en GitHub, porque Next las incrusta en el cliente); el resto de variables se inyecta en runtime desde *App Configs* de CapRover. Una nueva variable de servidor solo hay que darla de alta en CapRover; una nueva `NEXT_PUBLIC_*` requiere además añadir el `ARG`/`ENV` en el `Dockerfile`, el `build-args` del workflow y la variable en GitHub. El lockfile debe estar sincronizado con el npm de `node:22` (`npm ci` falla si no).

## Stack

Next.js 16 (App Router, `output: 'standalone'`) + React 19, TypeScript, Tailwind 4, next-intl, Prisma 7 con el adaptador del driver MariaDB, jose para JWT, almacenamiento compatible con S3 (Contabo) mediante `@aws-sdk/client-s3`, PayPal y logging con winston. El sitio es un marketplace de "packs" de imágenes (explorar, marcar favoritos/me gusta, comprar, participar/votar). Los textos de la interfaz y los mensajes de validación están mayormente en español.

## Arquitectura

Todo el código fuente está en `src/`; el alias `@/*` apunta a la raíz del repositorio, por lo que los imports se ven así: `@/src/app/utils/auth`.

### Pipeline de peticiones (`src/proxy.ts`, `src/proxies/`)
"Proxy" de Next 16 (antes middleware). `proxy.ts` exporta un `proxy` que ejecuta `chainProxies([withI18n(), withAuth])` — el orden importa, y un eslabón de la cadena solo corta el flujo cuando devuelve una respuesta distinta de 200 o un rewrite. `withAuth` verifica la cookie `accessToken`: `/my-purchases`, `/favorites` y `/my-account` redirigen a `/login` si no hay autenticación; `/login` y `/register` redirigen a `/` si el usuario ya está autenticado. Ten en cuenta que `proxy.ts` también tiene un export por defecto con el middleware simple de next-intl y que su `matcher` excluye `api`, `es` y `en`, por lo que el comportamiento con rutas con prefijo de idioma es sutil — revisa ambos antes de modificarlo.

### i18n
next-intl con los idiomas `es` (por defecto) y `en`; el routing está en `src/i18n/routing.ts` y los helpers de navegación (`Link`, `useRouter`, `redirect`…) se exportan desde `src/i18n/navigation.ts` — úsalos en lugar de `next/link`/`next/navigation` para enlaces que respeten el idioma. Los mensajes están en `public/locale/{locale}/common.json` (se cargan en `src/i18n/request.ts`). Las páginas viven en `src/app/[locale]/` y el layout raíz de ahí conecta `AuthProvider`, `AxiosInterceptorProvider` y los providers de toast/alert, además de llamar a `setRequestLocale` para el renderizado estático.

### Capa de datos
- `prisma/schema.prisma` → el cliente se genera en `generated/prisma` (salida personalizada, importada por ruta relativa en `src/app/utils/prisma.ts`, que crea un `PrismaClient` singleton con el adaptador `PrismaMariaDb` a partir de `DATABASE_URL`). Los nombres de los modelos usan `Snake_Case` (p. ej. `prisma.like_Pack`).
- `src/app/repositories/*.repository.ts` — el único lugar que debería llamar a Prisma; se exportan como objetos simples (p. ej. `repositoryAuth`, `repositoryLikePack`). Los tipos compartidos viven en `src/app/types/`.

### Autenticación
Autenticación JWT propia, sin librerías de terceros. `src/app/utils/auth.ts` firma y verifica los tokens de acceso y de refresco (HS256, con secretos distintos) y guarda `accessToken`/`refreshToken` como cookies httpOnly. En el cliente: `AuthProvider` → hook `useAuth` (`src/common/useAuth.ts`) mantiene el usuario en el contexto (el usuario inicial se resuelve en el servidor, en el layout de `[locale]`, con `getCurrentUser()`); `AxiosInterceptorProvider` captura un 401 en la instancia compartida de axios (`src/providers/api.tsx`), llama a `/api/auth/refresh`, reintenta una vez y cierra la sesión si falla.

### Dos vías de mutación
1. **Server actions** en `src/app/actions/actionForm*.ts` (`'use server'`, firma estilo `useActionState` `(prevState, formData) => IForm*`, validación con zod, devuelven `{ success, errors, fields }`). Las usan los formularios de login, registro, perfil, contraseña y correo.
2. **Route handlers** en `src/app/api/**/route.tsx` (auth, user, pack, buy-pack, like-pack, favorite-pack), que el cliente invoca a través de la instancia de axios. Los tipos privados de cada ruta van en una carpeta `_types/` contigua.

Ambas vías usan los mismos repositorios y helpers de `utils/auth`.

### Acceso a las páginas de un pack
Cada `page` es gratis (`page_type` 1), de registrados (3) o de pago (2); los ids están en `src/app/utils/page-access.ts`. `repositoryPage.findPagesPack(code, size, user_id?)` es el único punto que decide qué páginas ve el usuario: todas si el pack es gratuito (`pack_type` 2) o si hay una fila en `buy_pack`; si no, un anónimo ve solo las gratis y un usuario logueado las gratis y las de registrados (`pageTypesWithoutPurchase`). Los números de página pueden tener saltos, así que el visor navega por posición y no sumando al número. Hay dos versiones de cada imagen: el bucket público (`NEXT_PUBLIC_PACKS_URL_S3`) guarda solo las páginas gratis, **censuradas**, y el bucket privado (`AWS_BUCKET_PACKS_PRIVATE`) guarda todas, **sin censura**, servidas con URL firmada que caduca (`src/app/utils/pack-images.ts`, flag `censored`). Solo un anónimo viendo una página gratis (y las portadas/miniaturas de listados y admin) recibe la versión censurada; un logueado o comprador recibe siempre la del privado. markwater-kyaaa sube cada versión en una ejecución distinta (`AWS_BUCKET_TARGET`). Nunca armes a mano la URL de una imagen de pack: usa `page.url` / `portada.url`. Si `AWS_BUCKET_PACKS_PRIVATE` está vacía todo sale por la URL pública (útil antes de mover los archivos con `scripts/move-paid-pages.mjs`). Los cambios de esquema van como scripts en `data-base/migrations/`.

La descarga del pack (`GET /api/pack/download?code=`) no arma nada: `repositoryPage.findDownloadLevel` aplica las mismas reglas de acceso y `packZipUrl` devuelve una URL firmada de 10 min a un ZIP pregenerado por markwater-kyaaa (`USE_MODE=ZIP`) en el bucket privado: `<code>/zip/full.zip` (pack gratuito o comprado) o `<code>/zip/registered.zip` (logueado sin compra). Si el ZIP no existe responde 404. Los nombres de nivel (`ZIP_LEVEL` en `page-access.ts`) son contrato con markwater-kyaaa.

### Carpetas locales por funcionalidad
Dentro de `src/app/[locale]/<ruta>/`, las carpetas con prefijo de guion bajo `_components`, `_service`, `_types` y `_hooks` son privadas de esa ruta (no son enrutables). La UI transversal vive en `src/app/layout/components/` y `src/app/components/`.

### Otras utilidades (`src/app/utils/`)
`uploadS3.ts` + `sharp.ts` (procesamiento y subida de imágenes; los nombres de buckets y endpoints salen del entorno — ojo: la variable se escribe `AWS_ENPOINT`), `mail.ts` + `template-mails/` (plantillas HTML de nodemailer), `logger.ts` (archivos rotativos diarios de winston en `PATH_LOGS`), `jwt.ts`. Las imágenes de S3 se sirven con `next/image`, con una entrada en `remotePatterns` de `next.config.ts` restringida a la ruta del bucket de Contabo.
