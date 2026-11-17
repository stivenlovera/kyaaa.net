'use client'
import { useState } from 'react'
import moment from 'moment'
import { FaCopy, FaLink, FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/app/layout/components/navigate/use-loading-router'
import { useToast } from '@/src/providers/toastProvider'
import { CouponStatus, IAdminCoupon } from '@/src/app/types/coupon.types'
import { IPackOption } from '@/src/app/types/pack.types'
import { formatCouponCode } from '@/src/app/utils/coupon-code'
import { DialogCouponGenerate, redeemUrl } from './dialog-coupon-generate'
import { DialogDeleteCoupon } from './dialog-delete-coupon'

interface CouponListProps {
    coupons: IAdminCoupon[]
    total: number
    packs: IPackOption[]
    status?: CouponStatus
    packId?: number
}

const STATUS_LABEL: Record<CouponStatus, string> = { free: 'Libre', redeemed: 'Canjeado', expired: 'Caducado' }

const statusOf = (coupon: IAdminCoupon): CouponStatus =>
    coupon.user !== null ? 'redeemed' : new Date(coupon.expires_at) <= new Date() ? 'expired' : 'free'

const STATUS_CLASS: Record<CouponStatus, string> = {
    free: 'text-green-500',
    redeemed: 'text-neutral-400',
    expired: 'text-red-500',
}

export const CouponList = ({ coupons, total, packs, status, packId }: CouponListProps) => {
    const router = useRouter()
    const { showToast } = useToast()
    const [generating, setGenerating] = useState(false)
    const [deleting, setDeleting] = useState<IAdminCoupon | null>(null)

    const refresh = () => { router.refresh() }

    // Cambiar un filtro vuelve a la primera página.
    const setFilter = (next: { status?: string, pack?: string }) => {
        const params = new URLSearchParams()
        const s = 'status' in next ? next.status : status
        const p = 'pack' in next ? next.pack : packId?.toString()
        if (s) params.set('status', s)
        if (p) params.set('pack', p)
        const qs = params.toString()
        router.push(qs ? `/admin/coupon?${qs}` : '/admin/coupon')
    }

    const copy = async (text: string, message: string) => {
        try {
            await navigator.clipboard.writeText(text)
            showToast(message)
        } catch {
            showToast('No se pudo copiar', 'danger')
        }
    }

    return (
        <div>
            <div className='flex flex-col md:flex-row md:items-end gap-3 pb-3'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1'>
                    <div>
                        <label htmlFor='filter_status' className='block text-xs font-medium mb-1'>Estado</label>
                        <select
                            id='filter_status'
                            className='w-full'
                            value={status ?? ''}
                            onChange={(e) => { setFilter({ status: e.currentTarget.value }) }}
                        >
                            <option value=''>Todos</option>
                            {(Object.keys(STATUS_LABEL) as CouponStatus[]).map((s) => (
                                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor='filter_pack' className='block text-xs font-medium mb-1'>Pack</label>
                        <select
                            id='filter_pack'
                            className='w-full'
                            value={packId ?? ''}
                            onChange={(e) => { setFilter({ pack: e.currentTarget.value }) }}
                        >
                            <option value=''>Todos</option>
                            {packs.map((p) => (
                                <option key={p.pack_id} value={p.pack_id}>{p.name} ({p.code})</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    className='btn-primary flex items-center justify-center gap-2'
                    type='button'
                    onClick={() => { setGenerating(true) }}
                >
                    <FaPlus /> Generar códigos
                </button>
            </div>
            <p className='text-xs text-neutral-400 pb-2'>{total} cupón(es)</p>
            <div className='overflow-x-auto'>
                <table className='w-full text-left text-sm'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Código</th>
                            <th className='p-2'>Pack</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Caduca</th>
                            <th className='p-2'>Nota</th>
                            <th className='p-2'>Canjeado por</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={7}>No hay cupones.</td>
                            </tr>
                        ) : coupons.map((coupon) => {
                            const s = statusOf(coupon)
                            const code = formatCouponCode(coupon.code)
                            return (
                                <tr key={coupon.coupon_id} className='border-b border-neutral-800'>
                                    <td className='p-2 font-mono whitespace-nowrap'>{code}</td>
                                    <td className='p-2'>{coupon.pack.name}</td>
                                    <td className={'p-2 ' + STATUS_CLASS[s]}>{STATUS_LABEL[s]}</td>
                                    <td className='p-2 whitespace-nowrap'>{moment(coupon.expires_at).format('DD/MM/yyyy')}</td>
                                    <td className='p-2'>{coupon.note}</td>
                                    <td className='p-2'>
                                        {coupon.user && (
                                            <div>
                                                <div>{coupon.user.nick}</div>
                                                <div className='text-xs text-neutral-400'>{coupon.user.email}</div>
                                                {coupon.redeemed_at && (
                                                    <div className='text-xs text-neutral-400'>{moment(coupon.redeemed_at).format('DD/MM/yyyy hh:mm')}</div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className='p-2'>
                                        <div className='flex justify-end gap-2'>
                                            <button
                                                className='btn-primary-icon'
                                                type='button'
                                                aria-label='Copiar código'
                                                title='Copiar código'
                                                onClick={() => { copy(code, 'Código copiado') }}
                                            >
                                                <FaCopy />
                                            </button>
                                            {s === 'free' && (
                                                <button
                                                    className='btn-primary-icon'
                                                    type='button'
                                                    aria-label='Copiar enlace de canje'
                                                    title='Copiar enlace de canje'
                                                    onClick={() => { copy(redeemUrl(coupon.code), 'Enlace copiado') }}
                                                >
                                                    <FaLink />
                                                </button>
                                            )}
                                            {s !== 'redeemed' && (
                                                <button
                                                    className='btn-primary-icon text-red-500'
                                                    type='button'
                                                    aria-label='Eliminar'
                                                    title='Eliminar'
                                                    onClick={() => { setDeleting(coupon) }}
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <DialogCouponGenerate
                open={generating}
                packs={packs}
                defaultPackId={packId}
                onClose={() => { setGenerating(false) }}
                onGenerated={refresh}
            />
            <DialogDeleteCoupon
                open={deleting !== null}
                coupon={deleting}
                onClose={() => { setDeleting(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
