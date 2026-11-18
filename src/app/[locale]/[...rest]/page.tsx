import { notFound } from 'next/navigation'

// Cualquier ruta que no exista dentro de [locale] cae aquí y muestra [locale]/not-found.tsx, con la
// cabecera, el pie y los textos traducidos. Sin esto Next muestra su 404 por defecto, fuera del layout.
export default function CatchAll() {
    notFound()
}
