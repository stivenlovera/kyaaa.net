'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FaCheck, FaRotateLeft } from 'react-icons/fa6'
import { useRouter } from '@/src/app/layout/components/navigate/use-loading-router'
import { LocalDate } from '@/src/app/components/local-date'
import { AdminPaymentFilter, IAdminPaymentOrder } from '@/src/app/types/payment-order.types'
import { DialogDeliverPayment } from './dialog-deliver-payment'
import { DialogRefundPayment } from './dialog-refund-payment'

interface PaymentOrderListProps {
    orders: IAdminPaymentOrder[]
    total: number
    filter: AdminPaymentFilter
}

const FILTER_LABEL: Record<AdminPaymentFilter, string> = {
    partial: 'Parciales sin entregar',
    open: 'Sin entregar (con pago)',
    completed: 'Entregados',
    refunded: 'Devueltos',
    all: 'Todos',
}

const STATUS_LABEL: Record<string, string> = {
    created: 'Sin aviso',
    waiting: 'Esperando',
    confirming: 'Confirmando',
    confirmed: 'Confirmado',
    sending: 'Enviando',
    partially_paid: 'Parcial',
    finished: 'Pagado',
    failed: 'Fallido',
    refunded: 'Devuelto',
    expired: 'Caducado',
    amount_mismatch: 'Importe no coincide',
}

const money = (value: number) => `$${value.toFixed(2)}`

/** Porcentaje del precio recibido (en fiat), o null si no hay dato. */
export const paidPercent = (order: IAdminPaymentOrder): number | null =>
    order.paid?.fiat != null && order.amount > 0 ? (order.paid.fiat / order.amount) * 100 : null

export const PaymentOrderList = ({ orders, total, filter }: PaymentOrderListProps) => {
    const router = useRouter()
    const [delivering, setDelivering] = useState<IAdminPaymentOrder | null>(null)
    const [refunding, setRefunding] = useState<IAdminPaymentOrder | null>(null)

    const setFilter = (next: string) => {
        router.push(next === 'partial' ? '/admin/crypto' : `/admin/crypto?filter=${next}`)
    }

    return (
        <div className='grid gap-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 items-end'>
                <div>
                    <label htmlFor='crypto_filter' className='block text-xs font-medium mb-1'>Mostrar</label>
                    <select id='crypto_filter' className='w-full' value={filter} onChange={(e) => { setFilter(e.currentTarget.value) }}>
                        {(Object.keys(FILTER_LABEL) as AdminPaymentFilter[]).map((f) => (
                            <option key={f} value={f}>{FILTER_LABEL[f]}</option>
                        ))}
                    </select>
                </div>
                <p className='md:col-span-2 text-xs text-neutral-400'>
                    Un pago parcial se entrega solo si llega al umbral de tolerancia (95 % del precio por defecto). Por debajo, decide aquí si entregas el pack o lo devuelves: la devolución se hace en NOWPayments o desde tu exchange, y aquí solo se marca con su TxID.
                </p>
            </div>

            <div>
                <p className='text-xs text-neutral-400 pb-2'>{total} registro(s)</p>
                <div className='overflow-x-auto'>
                    <table className='w-full text-left text-sm'>
                        <thead>
                            <tr className='border-b border-neutral-700'>
                                <th className='p-2'>Fecha</th>
                                <th className='p-2'>Pack</th>
                                <th className='p-2'>Comprador</th>
                                <th className='p-2 text-right'>Precio</th>
                                <th className='p-2 text-right'>Recibido</th>
                                <th className='p-2'>Estado</th>
                                <th className='p-2'>Pago</th>
                                <th className='p-2'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td className='p-2' colSpan={8}>No hay pagos con este filtro.</td>
                                </tr>
                            ) : orders.map((order) => {
                                const percent = paidPercent(order)
                                const isOpen = order.completed_at === null && order.refund === null && order.status !== 'refunded'
                                const canDeliver = isOpen && order.payment_id !== null
                                return (
                                    <tr key={order.payment_order_id} className='border-b border-neutral-800'>
                                        <td className='p-2 whitespace-nowrap text-xs'>
                                            <LocalDate date={order.create_at} />
                                            <span className='block text-neutral-400'>#{order.payment_order_id}</span>
                                        </td>
                                        <td className='p-2 max-w-56 truncate'>
                                            <Link href={`/pack/${order.pack.code}`} className='hover:underline'>{order.pack.name}</Link>
                                        </td>
                                        <td className='p-2'>
                                            {order.user.nick}
                                            <span className='block text-xs text-neutral-400'>{order.user.email}</span>
                                        </td>
                                        <td className='p-2 text-right tabular-nums'>{money(order.amount)}</td>
                                        <td className='p-2 text-right tabular-nums'>
                                            {order.paid?.fiat != null ? money(order.paid.fiat) : '—'}
                                            {percent !== null && <span className='block text-xs text-neutral-400'>{percent.toFixed(1)} %</span>}
                                            {order.paid?.crypto != null && (
                                                <span className='block text-xs text-neutral-400 whitespace-nowrap'>
                                                    {order.paid.crypto} / {order.paid.expected ?? '?'} {order.paid.pay_currency?.toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                        <td className='p-2'>
                                            <span className='whitespace-nowrap'>
                                                {order.completed_at !== null ? 'Entregado' : STATUS_LABEL[order.status] ?? order.status}
                                            </span>
                                            {order.refund && (
                                                <span className='block text-xs text-neutral-400 max-w-48'>
                                                    <LocalDate date={order.refund.at} />
                                                    <span className='block font-mono break-all'>TxID {order.refund.txid}</span>
                                                    {order.refund.note && <span className='block'>{order.refund.note}</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td className='p-2 font-mono text-xs break-all'>{order.payment_id ?? '—'}</td>
                                        <td className='p-2'>
                                            {isOpen && (
                                                <div className='flex flex-col gap-2'>
                                                    {canDeliver && (
                                                        <button type='button' className='btn-primary whitespace-nowrap' onClick={() => { setDelivering(order) }}>
                                                            <FaCheck aria-hidden />
                                                            Entregar pack
                                                        </button>
                                                    )}
                                                    <button type='button' className='btn-primary whitespace-nowrap' onClick={() => { setRefunding(order) }}>
                                                        <FaRotateLeft aria-hidden />
                                                        Marcar como devuelto
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <DialogRefundPayment
                open={refunding !== null}
                order={refunding}
                onClose={() => { setRefunding(null) }}
                onRefunded={() => { router.refresh() }}
            />
            <DialogDeliverPayment
                open={delivering !== null}
                order={delivering}
                onClose={() => { setDelivering(null) }}
                onDelivered={() => { router.refresh() }}
            />
        </div>
    )
}
