'use client'
import { useEffect, useState } from 'react'
import moment from 'moment'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useToast } from '@/src/providers/toastProvider'
import { IAdminCoupon, IFormCouponGenerate } from '@/src/app/types/coupon.types'
import { IPackOption } from '@/src/app/types/pack.types'
import { IResponse } from '@/src/app/types/response'
import { formatCouponCode, MAX_COUPONS_PER_BATCH } from '@/src/app/utils/coupon-code'
import API from '@/src/providers/api'

/** Enlace que se le manda al comprador: abre /redeem con el código ya escrito. */
export const redeemUrl = (code: string) =>
    `${window.location.origin}/redeem?code=${encodeURIComponent(formatCouponCode(code))}`

interface DialogCouponGenerateProps {
    open: boolean
    onClose: () => void
    packs: IPackOption[]
    /** Pack preseleccionado (el del filtro del listado). */
    defaultPackId?: number
    onGenerated: () => void
}

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`

export const DialogCouponGenerate = ({ open, onClose, packs, defaultPackId, onGenerated }: DialogCouponGenerateProps) => {
    const { showToast } = useToast()
    const [form, setForm] = useState({ pack_id: 0, quantity: '1', expires_at: '', note: '' })
    const [generated, setGenerated] = useState<IAdminCoupon[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Al abrir: formulario vacío, caducidad por defecto a un año.
    useEffect(() => {
        if (open) {
            setForm({ pack_id: defaultPackId ?? 0, quantity: '1', expires_at: moment().add(1, 'year').format('YYYY-MM-DD'), note: '' })
            setGenerated(null)
            setError(null)
        }
    }, [open, defaultPackId])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        if (form.pack_id === 0) {
            setError('Elige un pack')
            return
        }
        setIsPending(true)
        try {
            const body: IFormCouponGenerate = {
                pack_id: form.pack_id,
                quantity: Number(form.quantity),
                expires_at: form.expires_at,
                note: form.note,
            }
            const { data } = await API.post<IResponse<IAdminCoupon[]>>('/api/coupon', body)
            if (data.success) {
                setGenerated(data.data)
                onGenerated()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    const copy = async (text: string, message: string) => {
        try {
            await navigator.clipboard.writeText(text)
            showToast(message)
        } catch {
            showToast('No se pudo copiar', 'danger')
        }
    }

    const downloadCsv = (coupons: IAdminCoupon[]) => {
        const rows = [
            ['codigo', 'enlace', 'pack', 'caduca', 'nota'],
            ...coupons.map((c) => [
                formatCouponCode(c.code),
                redeemUrl(c.code),
                c.pack.name,
                moment(c.expires_at).format('YYYY-MM-DD'),
                c.note ?? '',
            ]),
        ]
        // BOM para que Excel lea bien los acentos.
        const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        const a = document.createElement('a')
        a.href = url
        a.download = `cupones-${coupons[0]?.pack.code ?? 'pack'}-${moment().format('YYYYMMDD-HHmm')}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (generated !== null) {
        const codes = generated.map((c) => formatCouponCode(c.code)).join('\n')
        const links = generated.map((c) => redeemUrl(c.code)).join('\n')
        return (
            <Dialog isOpen={open} onClose={onClose} title='Códigos generados' panelClassName='md:w-[32rem]'
                footer={(
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <button className='btn-primary w-full' type='button' onClick={() => { copy(codes, 'Códigos copiados') }}>Copiar códigos</button>
                        <button className='btn-primary w-full' type='button' onClick={() => { copy(links, 'Enlaces copiados') }}>Copiar enlaces</button>
                        <button className='btn-primary w-full' type='button' onClick={() => { downloadCsv(generated) }}>Descargar CSV</button>
                        <button className='btn-primary w-full text-red-500' type='button' onClick={onClose}>Cerrar</button>
                    </div>
                )}
            >
                <div className='grid grid-cols-1 gap-3'>
                    <p className='text-sm'>
                        Se generaron <span className='font-bold'>{generated.length}</span> código(s) para <span className='font-bold'>{generated[0]?.pack.name}</span>.
                        Envía a cada comprador su código o su enlace; el enlace abre la página de canje con el código ya escrito.
                    </p>
                    <textarea className='w-full font-mono text-sm' rows={Math.min(10, generated.length + 1)} readOnly value={codes} />
                </div>
            </Dialog>
        )
    }

    return (
        <Dialog isOpen={open} onClose={onClose} title='Generar códigos'
            footer={(
                <div className='flex justify-between gap-3'>
                    <button className='btn-primary w-full text-red-500' type='button' onClick={onClose} disabled={isPending}>
                        Cerrar
                    </button>
                    <button className='btn-primary w-full' type='submit' form='dialog-coupon-generate' disabled={isPending}>
                        Generar
                    </button>
                </div>
            )}
        >
            <form id='dialog-coupon-generate' onSubmit={handleSubmit}>
                <div className='grid grid-cols-1 gap-4'>
                    <div>
                        <label htmlFor='pack_id' className='block text-xs font-medium mb-1'>Pack</label>
                        <select
                            id='pack_id'
                            className='w-full'
                            value={form.pack_id}
                            onChange={(e) => {
                                const pack_id = Number(e.currentTarget.value)
                                setForm((f) => ({ ...f, pack_id }))
                            }}
                            disabled={isPending}
                            required
                        >
                            <option value={0}>Elegir…</option>
                            {packs.map((p) => (
                                <option key={p.pack_id} value={p.pack_id}>{p.name} ({p.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor='quantity' className='block text-xs font-medium mb-1'>Cantidad</label>
                            <input
                                id='quantity'
                                className='w-full'
                                type='number'
                                min={1}
                                max={MAX_COUPONS_PER_BATCH}
                                value={form.quantity}
                                onChange={(e) => {
                                    const quantity = e.currentTarget.value
                                    setForm((f) => ({ ...f, quantity }))
                                }}
                                disabled={isPending}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor='expires_at' className='block text-xs font-medium mb-1'>Válido hasta (incluido)</label>
                            <input
                                id='expires_at'
                                className='w-full'
                                type='date'
                                min={moment().format('YYYY-MM-DD')}
                                value={form.expires_at}
                                onChange={(e) => {
                                    const expires_at = e.currentTarget.value
                                    setForm((f) => ({ ...f, expires_at }))
                                }}
                                disabled={isPending}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor='note' className='block text-xs font-medium mb-1'>Nota (opcional)</label>
                        <input
                            id='note'
                            className='w-full'
                            value={form.note}
                            maxLength={250}
                            placeholder='p. ej. Ko-fi, comprador, nº de pedido…'
                            onChange={(e) => {
                                const note = e.currentTarget.value
                                setForm((f) => ({ ...f, note }))
                            }}
                            disabled={isPending}
                        />
                    </div>
                    {error && <p className='text-red-500 text-xs'>{error}</p>}
                </div>
            </form>
        </Dialog>
    )
}
