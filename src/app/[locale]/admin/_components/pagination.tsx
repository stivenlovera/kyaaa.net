import Link from 'next/link'
import { FaAngleLeft, FaAngleRight, FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'

interface AdminPaginationProps {
    /** Ruta base del listado, sin query string, p. ej. '/admin/label'. */
    basePath: string
    page: number
    totalPages: number
    /** Parámetros extra que se conservan al cambiar de página (p. ej. un filtro). */
    query?: Record<string, string>
}

// Números visibles: primera, última y la actual con sus vecinas; los huecos se marcan con "…".
const visibleItems = (page: number, totalPages: number): (number | '…')[] => {
    const numbers = [...new Set([1, totalPages, page - 1, page, page + 1])]
        .filter((n) => n >= 1 && n <= totalPages)
        .sort((a, b) => a - b)
    const items: (number | '…')[] = []
    numbers.forEach((n, i) => {
        if (i > 0 && n - numbers[i - 1] > 1) {
            items.push('…')
        }
        items.push(n)
    })
    return items
}

const buttonClass = 'flex items-center justify-center p-2 hover:bg-gray-600 rounded-full'

export const AdminPagination = ({ basePath, page, totalPages, query = {} }: AdminPaginationProps) => {
    if (totalPages <= 1) {
        return null
    }
    const href = (n: number) => {
        const params = new URLSearchParams(query)
        if (n !== 1) {
            params.set('page', String(n))
        }
        const qs = params.toString()
        return qs === '' ? basePath : `${basePath}?${qs}`
    }

    return (
        <nav className='flex mx-auto flex-wrap items-center justify-center p-2'>
            {page > 1 && (<>
                <Link href={href(1)} className={buttonClass} aria-label='Primera página'>
                    <FaAnglesLeft className='text-xl' />
                </Link>
                <Link href={href(page - 1)} className={buttonClass} aria-label='Página anterior'>
                    <FaAngleLeft className='text-xl' />
                </Link>
            </>)}
            {visibleItems(page, totalPages).map((item, i) => item === '…' ? (
                <span key={`gap-${i}`} className='px-2'>…</span>
            ) : (
                <Link
                    key={item}
                    href={href(item)}
                    aria-current={item === page ? 'page' : undefined}
                    className={`min-w-10 text-center px-3 py-2 rounded-full hover:bg-gray-600 ${item === page ? 'bg-neutral-700 font-bold' : ''}`}
                >
                    {item}
                </Link>
            ))}
            {page < totalPages && (<>
                <Link href={href(page + 1)} className={buttonClass} aria-label='Página siguiente'>
                    <FaAngleRight className='text-xl' />
                </Link>
                <Link href={href(totalPages)} className={buttonClass} aria-label='Última página'>
                    <FaAnglesRight className='text-xl' />
                </Link>
            </>)}
        </nav>
    )
}
