'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from '@/src/app/layout/components/navigate/use-loading-router'
import { loginHref } from '@/src/app/utils/login-redirect'

interface LoginLinkProps {
    className?: string
    children: React.ReactNode
    /** Se ejecuta además de navegar (p. ej. cerrar el menú lateral). */
    onClick?: () => void
    /** Abrir la pestaña de registro en lugar de la de inicio de sesión. */
    register?: boolean
}

// Enlace a /login que, tras iniciar sesión, devuelve a la página actual (con su query string).
// El href usa solo la ruta (usePathname no obliga a un límite de Suspense como useSearchParams);
// al hacer clic se navega con la URL completa leída del navegador.
export const LoginLink = ({ className, children, onClick, register = false }: LoginLinkProps) => {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <Link
            href={loginHref(pathname, { register })}
            className={className}
            onClick={(e) => {
                onClick?.()
                // Ctrl/Cmd/clic central: que el navegador abra la pestaña con el href.
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
                    return
                }
                e.preventDefault()
                router.push(loginHref(window.location.pathname + window.location.search, { register }))
            }}
        >
            {children}
        </Link>
    )
}
