'use client'
import { useState } from 'react'
import moment from 'moment'
import Link from 'next/link'
import Image from 'next/image'
import { FaGear, FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { IAdminPack } from '@/src/app/types/pack.types'
import { IStatePack } from '@/src/app/types/state-pack.types'
import { DialogPackForm } from './dialog-pack-form'
import { DialogDeletePack } from './dialog-delete-pack'

interface PackListProps {
    packs: IAdminPack[]
    states: IStatePack[]
}

export const PackList = ({ packs, states }: PackListProps) => {
    const router = useRouter()
    const [editingPack, setEditingPack] = useState<IAdminPack | null | undefined>(undefined)
    const [deletingPack, setDeletingPack] = useState<IAdminPack | null>(null)

    const refresh = () => { router.refresh() }
    const stateName = (state_pack_id: number) => states.find((s) => s.state_pack_id === state_pack_id)?.name ?? state_pack_id

    return (
        <div>
            <div className='flex justify-end pb-3'>
                <button
                    className='btn-primary flex items-center gap-2'
                    type='button'
                    onClick={() => { setEditingPack(null) }}
                >
                    <FaPlus /> Crear pack
                </button>
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>ID</th>
                            <th className='p-2'></th>
                            <th className='p-2'>Nombre</th>
                            <th className='p-2'>Código</th>
                            <th className='p-2'>Precio</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Estado del pack</th>
                            <th className='p-2'>Actualizado</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {packs.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={9}>No hay packs registrados.</td>
                            </tr>
                        ) : packs.map((pack) => (
                            <tr key={pack.pack_id} className='border-b border-neutral-800'>
                                <td className='p-2'>{pack.pack_id}</td>
                                <td className='p-2'>
                                    {pack.thumbnail ? (
                                        <Image src={pack.thumbnail} alt={`Miniatura ${pack.name}`} width={60} height={78} className='w-15 h-auto' unoptimized />
                                    ) : (
                                        <div className='w-15 aspect-4/5 bg-neutral-900' />
                                    )}
                                </td>
                                <td className='p-2'>
                                    <div>{pack.name}</div>
                                    <div className='text-xs text-neutral-400'>
                                        Serie: {pack.pack_serie.map((s) => s.serie.name).join(', ') || '-'}
                                    </div>
                                    <div className='text-xs text-neutral-400'>
                                        Personajes: {pack.pack_character.map((c) => c.character.name).join(', ') || '-'}
                                    </div>
                                </td>
                                <td className='p-2'>{pack.code}</td>
                                <td className='p-2'>{pack.price_list}</td>
                                <td className='p-2'>{pack.state === 1 ? 'Activo' : 'Inactivo'}</td>
                                <td className='p-2'>{stateName(pack.state_pack_id)}</td>
                                <td className='p-2'>{pack.update_at ? moment(pack.update_at).format('DD/MM/yyyy hh:mm') : ''}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end gap-2'>
                                        <button
                                            className='btn-primary-icon'
                                            type='button'
                                            aria-label='Editar'
                                            onClick={() => { setEditingPack(pack) }}
                                        >
                                            <FaPen />
                                        </button>
                                        <Link
                                            className='btn-primary-icon'
                                            aria-label='Gestionar relaciones y páginas'
                                            title='Gestionar relaciones y páginas'
                                            href={`/admin/pack/edit?code=${pack.code}`}
                                        >
                                            <FaGear />
                                        </Link>
                                        <button
                                            className='btn-primary-icon text-red-500'
                                            type='button'
                                            aria-label='Eliminar'
                                            onClick={() => { setDeletingPack(pack) }}
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
            <DialogPackForm
                open={editingPack !== undefined}
                pack={editingPack}
                states={states}
                onClose={() => { setEditingPack(undefined) }}
                onSaved={refresh}
            />
            <DialogDeletePack
                open={deletingPack !== null}
                pack={deletingPack}
                onClose={() => { setDeletingPack(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
