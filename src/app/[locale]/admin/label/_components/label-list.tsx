'use client'
import { useState } from 'react'
import moment from 'moment'
import { FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { IAdminLabel } from '@/src/app/types/label.types'
import { DialogLabelForm } from './dialog-label-form'
import { DialogDeleteLabel } from './dialog-delete-label'

interface LabelListProps {
    labels: IAdminLabel[]
}

export const LabelList = ({ labels }: LabelListProps) => {
    const router = useRouter()
    const [editingLabel, setEditingLabel] = useState<IAdminLabel | null | undefined>(undefined)
    const [deletingLabel, setDeletingLabel] = useState<IAdminLabel | null>(null)

    const refresh = () => { router.refresh() }

    return (
        <div>
            <div className='flex justify-end pb-3'>
                <button
                    className='btn-primary flex'
                    type='button'
                    onClick={() => { setEditingLabel(null) }}
                >
                    <FaPlus /> Crear etiqueta
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
                        {labels.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={5}>No hay etiquetas registradas.</td>
                            </tr>
                        ) : labels.map((label) => (
                            <tr key={label.label_id} className='border-b border-neutral-800'>
                                <td className='p-2'>{label.name}</td>
                                <td className='p-2'>{label.slug}</td>
                                <td className='p-2'>{label.state === 1 ? 'Activo' : 'Inactivo'}</td>
                                <td className='p-2'>{label.update_at ? moment(label.update_at).format('DD/MM/yyyy hh:mm') : ''}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end gap-2'>
                                        <button
                                            className='btn-primary-icon'
                                            type='button'
                                            aria-label='Editar'
                                            onClick={() => { setEditingLabel(label) }}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            className='btn-primary-icon text-red-500'
                                            type='button'
                                            aria-label='Eliminar'
                                            onClick={() => { setDeletingLabel(label) }}
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
            <DialogLabelForm
                open={editingLabel !== undefined}
                label={editingLabel}
                onClose={() => { setEditingLabel(undefined) }}
                onSaved={refresh}
            />
            <DialogDeleteLabel
                open={deletingLabel !== null}
                label={deletingLabel}
                onClose={() => { setDeletingLabel(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
