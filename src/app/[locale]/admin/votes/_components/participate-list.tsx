'use client'
import { useState } from 'react'
import moment from 'moment'
import { FaBoxOpen, FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import Link from 'next/link'
import { useRouter } from '@/src/i18n/navigation'
import { IAdminParticipate, IStateParticipate } from '@/src/app/types/participate.types'
import { DialogParticipateForm } from './dialog-participate-form'
import { formatDay } from '@/src/app/utils/other'
import { DialogDeleteParticipate } from './dialog-delete-participate'

interface ParticipateListProps {
    participates: IAdminParticipate[]
    states: IStateParticipate[]
}

export const ParticipateList = ({ participates, states }: ParticipateListProps) => {
    const router = useRouter()
    const [editing, setEditing] = useState<IAdminParticipate | null | undefined>(undefined)
    const [deleting, setDeleting] = useState<IAdminParticipate | null>(null)

    const refresh = () => { router.refresh() }

    return (
        <div>
            <div className='flex justify-end pb-3'>
                <button
                    className='btn-primary flex items-center gap-2'
                    type='button'
                    onClick={() => { setEditing(null) }}
                >
                    <FaPlus /> Crear participación
                </button>
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Nombre</th>
                            <th className='p-2'>Inicio</th>
                            <th className='p-2'>Fin</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Packs</th>
                            <th className='p-2'>Votos</th>
                            <th className='p-2'>Actualizado</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {participates.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={8}>No hay participaciones registradas.</td>
                            </tr>
                        ) : participates.map((participate) => (
                            <tr key={participate.participate_id} className='border-b border-neutral-800'>
                                <td className='p-2'>{participate.name}</td>
                                <td className='p-2 whitespace-nowrap'>{formatDay(participate.start_date)}</td>
                                <td className='p-2 whitespace-nowrap'>{formatDay(participate.start_end)}</td>
                                <td className='p-2'>{participate.state_name}</td>
                                <td className='p-2'>{participate.total_packs}</td>
                                <td className='p-2'>{participate.total_votes}</td>
                                <td className='p-2 whitespace-nowrap'>{participate.update_at ? moment(participate.update_at).format('DD/MM/yyyy hh:mm') : ''}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end gap-2'>
                                        <Link
                                            className='btn-primary-icon'
                                            href={`/admin/votes/edit?id=${participate.participate_id}`}
                                            aria-label='Packs'
                                            title='Packs de la participación'
                                        >
                                            <FaBoxOpen />
                                        </Link>
                                        <button
                                            className='btn-primary-icon'
                                            type='button'
                                            aria-label='Editar'
                                            title='Editar'
                                            onClick={() => { setEditing(participate) }}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            className='btn-primary-icon text-red-500'
                                            type='button'
                                            aria-label='Eliminar'
                                            title='Eliminar'
                                            onClick={() => { setDeleting(participate) }}
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
            <DialogParticipateForm
                open={editing !== undefined}
                participate={editing}
                states={states}
                onClose={() => { setEditing(undefined) }}
                onSaved={refresh}
            />
            <DialogDeleteParticipate
                open={deleting !== null}
                participate={deleting}
                onClose={() => { setDeleting(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
