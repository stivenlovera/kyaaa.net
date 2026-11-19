'use client'
import { useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPaymentOrder } from '@/src/app/types/payment-order.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogRefundPaymentProps {
    open: boolean
    order: IAdminPaymentOrder | null
    onClose: () => void
    onRefunded: () => void
}

// Deja constancia de una devolución hecha fuera de kyaaa.net (panel de NOWPayments o retiro desde el exchange).
// No mueve dinero: guarda el TxID y una nota, y la orden deja de estar pendiente.
export const DialogRefundPayment = ({ open, order, onClose, onRefunded }: DialogRefundPaymentProps) => {
    const { setAlert } = useAlert()
    const [txid, setTxid] = useState('')
    const [note, setNote] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const close = () => { setError(null); setTxid(''); setNote(''); onClose() }

    const handleRefund = async () => {
        if (order === null) return
        if (txid.trim() === '') {
            setError('Indica el TxID de la devolución')
            return
        }
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.post<IResponse<{ result: string }>>('/api/admin/payment-order', {
                payment_order_id: order.payment_order_id,
                action: 'refund',
                txid: txid.trim(),
                note: note.trim(),
            })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: data.message })
                onRefunded()
                close()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    const fiat = order?.paid?.fiat ?? null
    const crypto = order?.paid?.crypto ?? null
    const received = crypto !== null
        ? `${crypto} ${order?.paid?.pay_currency?.toUpperCase() ?? ''}${fiat !== null ? ` (~$${fiat.toFixed(2)})` : ''}`
        : 'sin dato'

    return (
        <Dialog isOpen={open} onClose={close} title='Marcar como devuelto'
            footer={(
                <div className='flex justify-between gap-3'>
                    <button className='btn-primary w-full' type='button' onClick={close} disabled={isPending}>
                        Cerrar
                    </button>
                    <button className='btn-primary w-full' type='button' onClick={handleRefund} disabled={isPending}>
                        Marcar como devuelto
                    </button>
                </div>
            )}
        >
            <div className='grid grid-cols-1 gap-4'>
                <p>
                    Pago #{order?.payment_order_id} de <span className='font-bold'>{order?.user.nick}</span> por <span className='font-bold'>{order?.pack.name}</span>. Recibido: {received}.
                </p>
                <p className='text-sm text-neutral-400'>
                    Esto no envía dinero: haz antes la devolución desde NOWPayments o desde tu exchange (a la dirección de depósito del comprador) y pega aquí su TxID. El comprador no recibirá el pack y los avisos posteriores de este pago se ignorarán.
                </p>
                <div>
                    <label htmlFor='refund_txid' className='block text-xs font-medium mb-1'>TxID de la devolución</label>
                    <input
                        id='refund_txid'
                        className='w-full font-mono'
                        value={txid}
                        maxLength={150}
                        placeholder='p. ej. 0x1dd…90bb9'
                        onChange={(e) => { setTxid(e.currentTarget.value) }}
                        disabled={isPending}
                    />
                </div>
                <div>
                    <label htmlFor='refund_note' className='block text-xs font-medium mb-1'>Nota (opcional)</label>
                    <input
                        id='refund_note'
                        className='w-full'
                        value={note}
                        maxLength={250}
                        placeholder='p. ej. devueltos 6.42 USDT por BSC desde Binance'
                        onChange={(e) => { setNote(e.currentTarget.value) }}
                        disabled={isPending}
                    />
                </div>
                {error && <p className='text-red-500 text-xs'>{error}</p>}
            </div>
        </Dialog>
    )
}
