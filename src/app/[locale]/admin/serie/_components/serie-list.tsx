'use client'
import { useState } from 'react'
import moment from 'moment'
import { FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { IAdminSerie } from '@/src/app/types/serie.types'
import { DialogSerieForm } from './dialog-serie-form'
import { DialogDeleteSerie } from './dialog-delete-serie'

interface SerieListProps {
    series: IAdminSerie[]
}

export const SerieList = ({ series }: SerieListProps) => {
    const router = useRouter()
    const [editingSerie, setEditingSerie] = useState<IAdminSerie | null | undefined>(undefined)
    const [deletingSerie, setDeletingSerie] = useState<IAdminSerie | null>(null)

    const refresh = () => { router.refresh() }

    return (
        <div>
            <div className='flex justify-end pb-3'>
                <button
                    className='btn-primary flex'
                    type='button'
                    onClick={() => { setEditingSerie(null) }}
                >
                    <FaPlus /> Crear serie
                </button>
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Nombre</th>
                            <th className='p-2'>Slug</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Actualizado</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {series.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={5}>No hay series registradas.</td>
                            </tr>
                        ) : series.map((serie) => (
                            <tr key={serie.serie_id} className='border-b border-neutral-800'>
                                <td className='p-2'>{serie.name}</td>
                                <td className='p-2'>{serie.slug}</td>
                                <td className='p-2'>{serie.state === 1 ? 'Activo' : 'Inactivo'}</td>
                                <td className='p-2'>{serie.update_at ? moment(serie.update_at).format('DD/MM/yyyy hh:mm') : ''}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end gap-2'>
                                        <button
                                            className='btn-primary-icon'
                                            type='button'
                                            aria-label='Editar'
                                            onClick={() => { setEditingSerie(serie) }}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            className='btn-primary-icon text-red-500'
                                            type='button'
                                            aria-label='Eliminar'
                                            onClick={() => { setDeletingSerie(serie) }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <DialogSerieForm
                open={editingSerie !== undefined}
                serie={editingSerie}
                onClose={() => { setEditingSerie(undefined) }}
                onSaved={refresh}
            />
            <DialogDeleteSerie
                open={deletingSerie !== null}
                serie={deletingSerie}
                onClose={() => { setDeletingSerie(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
