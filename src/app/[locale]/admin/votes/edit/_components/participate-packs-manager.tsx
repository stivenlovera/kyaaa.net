'use client'
import { useState } from 'react'
import moment from 'moment'
import { FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminParticipatePack } from '@/src/app/types/participate.types'
import { IPackOption } from '@/src/app/types/pack.types'
import { STATE_PACK_PARTICIPATE } from '@/src/app/utils/page-access'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'
import { DialogDeleteParticipatePack } from './dialog-delete-participate-pack'

interface ParticipatePacksManagerProps {
    participate_id: number
    packs: IPackOption[]
    items: IAdminParticipatePack[]
}

// Packs inscritos en la participación (participate_pack): un selector para agregar y la grilla con sus votos.
export const ParticipatePacksManager = ({ participate_id, packs, items }: ParticipatePacksManagerProps) => {
    const router = useRouter()
    const { setAlert } = useAlert()
    const [packId, setPackId] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [toDelete, setToDelete] = useState<IAdminParticipatePack | null>(null)

    // Solo se ofrecen los packs que aún no están en la participación.
    const available = packs.filter((p) => !items.some((i) => i.pack_id === p.pack_id))

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        if (packId === 0) {
            setError('Elige un pack')
            return
        }
        setIsPending(true)
        try {
            const { data } = await API.post<IResponse<boolean>>('/api/participate/pack', { participate_id, pack_id: packId })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Pack agregado correctamente' })
                setPackId(0)
                router.refresh()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className='grid grid-cols-1 gap-4'>
            <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row sm:items-end gap-3'>
                <div className='flex-1'>
                    <label htmlFor='pack_id' className='block text-xs font-medium mb-1'>Pack</label>
                    <select
                        id='pack_id'
                        className='w-full'
                        value={packId}
                        onChange={(e) => { setPackId(Number(e.currentTarget.value)) }}
                        disabled={isPending || available.length === 0}
                    >
                        <option value={0}>{available.length === 0 ? 'No hay más packs en «borrador» para agregar' : 'Elegir…'}</option>
                        {available.map((p) => (
                            <option key={p.pack_id} value={p.pack_id}>{p.name} ({p.code})</option>
                        ))}
                    </select>
                </div>
                <button className='btn-primary flex items-center justify-center gap-2' type='submit' disabled={isPending || packId === 0}>
                    <FaPlus /> Agregar pack
                </button>
            </form>
            {error && <p className='text-red-500 text-xs'>{error}</p>}

            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Pack</th>
                            <th className='p-2'>Código</th>
                            <th className='p-2'>Estado del pack</th>
                            <th className='p-2'>Votos</th>
                            <th className='p-2'>Agregado</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={6}>Esta participación todavía no tiene packs.</td>
                            </tr>
                        ) : items.map((item) => (
                            <tr key={item.participate_pack_id} className='border-b border-neutral-800'>
                                <td className='p-2'>{item.name}</td>
                                <td className='p-2'>{item.code}</td>
                                <td className='p-2'>
                                    {item.state_pack_name ?? '-'}
                                    {item.state_pack_id !== STATE_PACK_PARTICIPATE && (
                                        <span className='block text-xs text-yellow-500'>No se muestra en /participate</span>
                                    )}
                                </td>
                                <td className='p-2'>{item.votes}</td>
                                <td className='p-2 whitespace-nowrap'>{item.create_at ? moment(item.create_at).format('DD/MM/yyyy hh:mm') : ''}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end'>
                                        <button
                                            className='btn-primary-icon text-red-500'
                                            type='button'
                                            aria-label='Quitar'
                                            title={item.votes > 0 ? 'Tiene votos: no se puede quitar' : 'Quitar'}
                                            onClick={() => { setToDelete(item) }}
                                            disabled={item.votes > 0}
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

            <DialogDeleteParticipatePack
                open={toDelete !== null}
                item={toDelete}
                onClose={() => { setToDelete(null) }}
                onDeleted={() => { router.refresh() }}
            />
        </div>
    )
}
