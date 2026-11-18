import Link from 'next/link'

interface NumericPaginationProps {
    code: string
    page: number
    totalPages: number
    /** Ancla a la que se desplaza al cambiar de página. */
    anchor?: string
}

// Paginador simple: todos los números de página (1 2 3 4…), sin iconos ni flechas; flex-wrap los baja de línea si no caben.
export const NumericPagination = ({ code, page, totalPages, anchor }: NumericPaginationProps) => {
    if (totalPages <= 1) {
        return null
    }
    const href = (n: number) => `/pack/${code}${n === 1 ? '' : `?p=${n}`}${anchor ? `#${anchor}` : ''}`

    return (
        <nav className='flex mx-auto flex-wrap items-center justify-center gap-1 p-2 text-sm'>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                    key={n}
                    href={href(n)}
                    aria-current={n === page ? 'page' : undefined}
                    className={`min-w-9 text-center py-1 rounded-full hover:bg-gray-600 ${n === page ? 'bg-neutral-700 font-bold' : ''}`}
                >
                    {n}
                </Link>
            ))}
        </nav>
    )
}
