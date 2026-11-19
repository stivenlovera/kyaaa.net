'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPaymentOrder } from '@/src/app/types/payment-order.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogDeliverPaymentProps {
    open: boolean
    order: IAdminPaymentOrder | null
    onClose: () => void
    onDelivered: () => void
}

// Entrega a mano el pack de un pago que no se completó solo: crea la compra, marca el pago como entregado
// y envía los correos de compra al comprador.
export const DialogDeliverPayment = ({ open, order, onClose, onDelivered }: DialogDeliverPaymentProps) => {
    const { setAlert } = useAlert()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const close = () => { setError(null); onClose() }

    const handleDeliver = async () => {
        if (order === null) return
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.post<IResponse<{ result: string }>>('/api/admin/payment-order', { payment_order_id: order.payment_order_id })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: data.message })
                onDelivered()
                onClose()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    const fiat = order?.paid?.fiat ?? null
    const received = fiat !== null && order ? `$${fiat.toFixed(2)} de $${order.amount.toFixed(2)} (${((fiat / order.amount) * 100).toFixed(1)} %)` : 'sin dato'

    return (
        <Dialog isOpen={open} onClose={close} title='Entregar pack'
            footer={(
                <div className='flex justify-between gap-3'>
                    <button className='btn-primary w-full' type='button' onClick={close} disabled={isPending}>
                        Cerrar
                    </button>
                    <button className='btn-primary w-full' type='button' onClick={handleDeliver} disabled={isPending}>
                        Entregar
                    </button>
                </div>
            )}
        >
            <div className='grid grid-cols-1 gap-4'>
                <p>
                    ¿Entregar <span className='font-bold'>{order?.pack.name}</span> a <span className='font-bold'>{order?.user.nick}</span>?
                </p>
                <p className='text-sm text-neutral-400'>
                    Recibido: {received}. La venta se registrará con lo recibido como bruto y el comprador recibirá el correo de compra.
                </p>
                {error && <p className='text-red-500 text-xs'>{error}</p>}
            </div>
        </Dialog>
    )
}
