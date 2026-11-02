import { requireAdminPage } from '@/src/app/utils/auth'
import Link from 'next/link'
import {
    FaBoxOpen,
    FaSquarePollVertical,
    FaUserPen,
    FaMasksTheater,
    FaFilm,
    FaTag,
} from 'react-icons/fa6'
import { AdminBreadcrumb } from './_components/breadcrumb'

const sections = [
    { href: '/admin/pack', label: 'Packs', icon: FaBoxOpen },
    { href: '/admin/author', label: 'Autores', icon: FaUserPen },
    { href: '/admin/character', label: 'Personajes', icon: FaMasksTheater },
    { href: '/admin/serie', label: 'Series', icon: FaFilm },
    { href: '/admin/label', label: 'Etiquetas', icon: FaTag },
    { href: '/admin/votes', label: 'Votaciones', icon: FaSquarePollVertical },
]

export default async function Page() {
    await requireAdminPage()
    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {sections.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} className='card flex flex-col items-center gap-2 hover:bg-neutral-800'>
                        <Icon className='text-4xl' />
                        <h5 className='text-lg font-bold'>{label}</h5>
                    </Link>
                ))}
            </div>
        </div>
    )
}
