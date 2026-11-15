'use client'
import { useState } from 'react'
import moment from 'moment'
import { FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { IAdminPlatform } from '@/src/app/types/platform.types'
import { DialogPlatformForm } from './dialog-platform-form'
import { DialogDeletePlatform } from './dialog-delete-platform'

interface PlatformListProps {
    platforms: IAdminPlatform[]
}

export const PlatformList = ({ platforms }: PlatformListProps) => {
    const router = useRouter()
    const [editingPlatform, setEditingPlatform] = useState<IAdminPlatform | null | undefined>(undefined)
    const [deletingPlatform, setDeletingPlatform] = useState<IAdminPlatform | null>(null)

    const refresh = () => { router.refresh() }

    return (
        <div>
            <div className='flex justify-end pb-3'>
                <button
                    className='btn-primary flex items-center gap-2'
                    type='button'
                    onClick={() => { setEditingPlatform(null) }}
                >
                    <FaPlus /> Crear plataforma
                </button>
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Nombre</th>
                            <th className='p-2'>Slug</th>
                            <th className='p-2'>URL base</th>
                            <th className='p-2'>Tipo</th>
                            <th className='p-2'>Uso</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Actualizado</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {platforms.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={8}>No hay plataformas registradas.</td>
                            </tr>
                        ) : platforms.map((platform) => (
                            <tr key={platform.platform_id} className='border-b border-neutral-800'>
                                <td className='p-2'>{platform.name}</td>
                                <td className='p-2'>{platform.slug}</td>
                                <td className='p-2 max-w-48 truncate'>
                                    {platform.base_url
                                        ? <a className='text-blue-500 underline' href={platform.base_url} target='_blank' rel='noopener noreferrer'>{platform.base_url}</a>
                                        : ''}
                                </td>
                                <td className='p-2'>{platform.is_external === 1 ? 'Externa' : 'Propia'}</td>
                                <td className='p-2'>{platform.is_payment === 1 ? 'Pasarela de pago' : 'Red social'}</td>
                                <td className='p-2'>{platform.state === 1 ? 'Activo' : 'Inactivo'}</td>
                                <td className='p-2 whitespace-nowrap'>{platform.update_at ? moment(platform.update_at).format('DD/MM/yyyy hh:mm') : ''}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end gap-2'>
                                        <button
                                            className='btn-primary-icon'
                                            type='button'
                                            aria-label='Editar'
                                            onClick={() => { setEditingPlatform(platform) }}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            className='btn-primary-icon text-red-500'
                                            type='button'
                                            aria-label='Eliminar'
                                            onClick={() => { setDeletingPlatform(platform) }}
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
            <DialogPlatformForm
                open={editingPlatform !== undefined}
                platform={editingPlatform}
                onClose={() => { setEditingPlatform(undefined) }}
                onSaved={refresh}
            />
            <DialogDeletePlatform
                open={deletingPlatform !== null}
                platform={deletingPlatform}
                onClose={() => { setDeletingPlatform(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
