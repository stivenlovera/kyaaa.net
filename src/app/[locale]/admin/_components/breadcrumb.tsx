import { FaChevronRight } from 'react-icons/fa6'
import Link from 'next/link'

export interface BreadcrumbItem {
    label: string
    /** Sin href es la página actual (el último elemento). */
    href?: string
}

// Miga de pan de /admin: siempre empieza en "Admin" y le siguen los `items` de la página.
export const AdminBreadcrumb = ({ items = [] }: { items?: BreadcrumbItem[] }) => {
    const all: BreadcrumbItem[] = [{ label: 'Admin', href: items.length > 0 ? '/admin' : undefined }, ...items]
    return (
        <nav aria-label='Miga de pan' className='pb-3'>
            <ol className='flex flex-wrap items-center gap-2 text-sm text-neutral-400'>
                {all.map(({ label, href }, index) => (
                    <li key={index} className='flex items-center gap-2'>
                        {index > 0 && <FaChevronRight size={10} aria-hidden />}
                        {href !== undefined
                            ? <Link href={href} className='hover:text-white hover:underline'>{label}</Link>
                            : <span className='text-white truncate max-w-64' aria-current='page'>{label}</span>}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
