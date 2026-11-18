'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FaImages } from 'react-icons/fa6'
import { IAdminPackPosters, PosterFilter } from '@/src/app/types/platform.types'

interface PackPosterListProps {
    packs: IAdminPackPosters[]
    filter: PosterFilter
}

const FILTER_LABELS: Record<PosterFilter, string> = {
    all: 'Todos los packs',
    with: 'Con pósters',
    without: 'Sin pósters',
}

// Un pack por fila con el resumen de sus pósters; "Gestionar" abre la pantalla de pósters de ese pack.
export const PackPosterList = ({ packs, filter }: PackPosterListProps) => {
    // next/navigation: el pathname ya incluye el prefijo de idioma, así el filtro lo conserva.
    const router = useRouter()
    const pathname = usePathname()

    return (
        <div>
            <div className='flex justify-end pb-3'>
                <div className='w-full sm:w-60'>
                    <label htmlFor='poster_filter' className='block text-xs font-medium mb-1'>Mostrar</label>
                    <select
                        id='poster_filter'
                        className='w-full'
                        value={filter}
                        onChange={(e) => {
                            const value = e.currentTarget.value as PosterFilter
                            router.push(value === 'all' ? pathname : `${pathname}?filter=${value}`)
                        }}
                    >
                        {(Object.keys(FILTER_LABELS) as PosterFilter[]).map((key) => (
                            <option key={key} value={key}>{FILTER_LABELS[key]}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Pack</th>
                            <th className='p-2'>Pósters</th>
                            <th className='p-2'>Plataformas</th>
                            <th className='p-2'>Clics</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {packs.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={5}>No hay packs para mostrar.</td>
                            </tr>
                        ) : packs.map((pack) => (
                            <tr key={pack.pack_id} className='border-b border-neutral-800'>
                                <td className='p-2'>
                                    {pack.name}
                                    <span className='block text-xs text-neutral-400'>{pack.code}</span>
                                </td>
                                <td className='p-2 whitespace-nowrap'>
                                    {pack.items.length === 0
                                        ? <span className='text-neutral-400'>Ninguno</span>
                                        : <>{pack.items.length} <span className='text-xs text-neutral-400'>({pack.active} activos)</span></>}
                                </td>
                                <td className='p-2'>
                                    <div className='flex flex-wrap gap-1'>
                                        {pack.items.map((item) => (
                                            <span
                                                key={item.pack_platform_id}
                                                className={`text-xs px-2 py-0.5 rounded-full bg-neutral-700 ${item.state === 1 ? '' : 'line-through text-neutral-500'}`}
                                                title={item.state === 1 ? 'Activo' : 'Inactivo'}
                                            >
                                                {item.platform.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className='p-2'>{pack.clicks}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end'>
                                        <Link
                                            className='btn-primary flex whitespace-nowrap'
                                            href={`/admin/pack-platform/edit?code=${pack.code}`}
                                        >
                                            <FaImages /> Gestionar
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    )
}
