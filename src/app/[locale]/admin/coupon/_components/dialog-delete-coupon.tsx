'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminCoupon } from '@/src/app/types/coupon.types'
import { IResponse } from '@/src/app/types/response'
import { formatCouponCode } from '@/src/app/utils/coupon-code'
import API from '@/src/providers/api'

interface DialogDeleteCouponProps {
    open: boolean
    onClose: () => void
    coupon: IAdminCoupon | null
    onDeleted: () => void
}

// Solo se ofrece para cupones sin canjear: borrarlo lo invalida (p. ej. un código enviado por error).
export const DialogDeleteCoupon = ({ open, onClose, coupon, onDeleted }: DialogDeleteCouponProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const handleDelete = async () => {
        if (coupon === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.delete<IResponse<null>>('/api/coupon', { data: { coupon_id: coupon.coupon_id } })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Cupón eliminado correctamente' })
                onDeleted()
                onClose()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog isOpen={open} onClose={() => { setError(null); onClose() }} title='Eliminar cupón'
            footer={(
                <div className='flex justify-between gap-3'>
                    <button className='btn-primary w-full' type='button' onClick={() => { setError(null); onClose() }} disabled={isPending}>
                        Cerrar
                    </button>
                    <button className='btn-primary w-full text-red-500' type='button' onClick={handleDelete} disabled={isPending}>
                        Eliminar
                    </button>
                </div>
            )}
        >
            <div className='grid grid-cols-1 gap-4'>
                <p>
                    ¿Seguro que quieres eliminar el cupón <span className='font-bold font-mono'>{coupon ? formatCouponCode(coupon.code) : ''}</span> de <span className='font-bold'>{coupon?.pack.name}</span>? Dejará de poder canjearse.
                </p>
                {error && <p className='text-red-500 text-xs'>{error}</p>}
            </div>
        </Dialog>
    )
}
