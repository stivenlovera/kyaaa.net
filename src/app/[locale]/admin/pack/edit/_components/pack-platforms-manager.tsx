'use client'
import { useState } from 'react'
import { FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { IAdminPackPlatform, IPlatform } from '@/src/app/types/platform.types'
import { DialogDeletePlatform } from './dialog-delete-platform'
import { DialogPlatformPosterForm } from './dialog-platform-poster-form'

interface PackPlatformsManagerProps {
    pack_id: number
    platforms: IPlatform[]
    items: IAdminPackPlatform[]
}

// Pósters del pack por plataforma (debajo del botón comprar): la lista con sus clics; agregar y editar
// abren el formulario en un modal.
export const PackPlatformsManager = ({ pack_id, platforms, items }: PackPlatformsManagerProps) => {
    const router = useRouter()
    // undefined = modal cerrado; null = agregar; un póster = editarlo.
    const [editing, setEditing] = useState<IAdminPackPlatform | null | undefined>(undefined)
    const [toDelete, setToDelete] = useState<IAdminPackPlatform | null>(null)

    const refresh = () => { router.refresh() }

    return (
        <div className='grid grid-cols-1 gap-4'>
            <div className='flex justify-end'>
                <button className='btn-primary flex' type='button' onClick={() => { setEditing(null) }}>
                    <FaPlus /> Agregar póster
                </button>
            </div>

            {items.length === 0 ? (
                <p className='text-sm text-neutral-400'>Este pack todavía no tiene pósters.</p>
            ) : (
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead>
                            <tr className='text-left border-b border-neutral-700'>
                                <th className='p-2'>Póster</th>
                                <th className='p-2'>Plataforma</th>
                                <th className='p-2'>Enlace</th>
                                <th className='p-2'>Orden</th>
                                <th className='p-2'>Clics</th>
                                <th className='p-2'>Estado</th>
                                <th className='p-2'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.pack_platform_id} className='border-b border-neutral-800'>
                                    <td className='p-2'>
                                        <img src={item.poster} alt='' className='w-16 h-20 object-cover rounded bg-neutral-900' />
                                    </td>
                                    <td className='p-2'>{item.platform.name}</td>
                                    <td className='p-2 max-w-48 truncate'>
                                        <a className='text-blue-500 underline' href={item.url} target='_blank' rel='noopener noreferrer'>{item.url}</a>
                                    </td>
                                    <td className='p-2'>{item.sort}</td>
                                    <td className='p-2'>{item.clicks}</td>
                                    <td className='p-2'>{item.state === 1 ? 'Activo' : 'Inactivo'}</td>
                                    <td className='p-2'>
                                        <div className='flex gap-1'>
                                            <button className='btn-primary-icon' type='button' aria-label='Editar' title='Editar' onClick={() => { setEditing(item) }}>
                                                <FaPen />
                                            </button>
                                            <button className='btn-primary-icon text-red-500' type='button' aria-label='Eliminar' title='Eliminar' onClick={() => { setToDelete(item) }}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <DialogPlatformPosterForm
                open={editing !== undefined}
                onClose={() => { setEditing(undefined) }}
                pack_id={pack_id}
                platforms={platforms}
                items={items}
                item={editing ?? null}
                onSaved={refresh}
            />
            <DialogDeletePlatform
                open={toDelete !== null}
                item={toDelete}
                onClose={() => { setToDelete(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
