import Link from 'next/link'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6'
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6'

interface NumericPaginationProps {
    code: string
    page: number
    totalPages: number
    /** Ancla a la que se desplaza al cambiar de página. */
    anchor?: string
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

const buttonClass = 'flex items-center justify-center hover:bg-gray-600 rounded-full'

export const NumericPagination = ({ code, page, totalPages, anchor }: NumericPaginationProps) => {
    if (totalPages <= 1) {
        return null
    }
    const href = (n: number) => `/pack/${code}${n === 1 ? '' : `?p=${n}`}${anchor ? `#${anchor}` : ''}`

    return (
        <nav className='flex mx-auto flex-wrap items-center justify-center p-2 text-sm'>
            {page > 1 && (<>
                <Link href={href(1)} className={buttonClass} aria-label='Primera página'>
                    <FaAnglesLeft className='text-sm m-2' />
                </Link>
                <Link href={href(page - 1)} className={buttonClass} aria-label='Página anterior'>
                    <FaAngleLeft className='text-sm m-2' />
                </Link>
            </>)}
            {visibleItems(page, totalPages).map((item, i) => item === '…' ? (
                <span key={`gap-${i}`} className=''>…</span>
            ) : (
                <Link
                    key={item}
                    href={href(item)}
                    aria-current={item === page ? 'page' : undefined}
                    className={`min-w-9 text-center py-1 rounded-full hover:bg-gray-600 ${item === page ? 'bg-neutral-700 font-bold' : ''}`}
                >
                    {item}
                </Link>
            ))}
            {page < totalPages && (<>
                <Link href={href(page + 1)} className={buttonClass} aria-label='Página siguiente'>
                    <FaAngleRight className='text-sm m-2' />
                </Link>
                <Link href={href(totalPages)} className={buttonClass} aria-label='Última página'>
                    <FaAnglesRight className='text-sm m-2' />
                </Link>
            </>)}
        </nav>
    )
}
