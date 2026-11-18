'use client'
import { useState } from 'react'
import { useRouter } from '@/src/app/layout/components/navigate/use-loading-router'
import { IPackOption } from '@/src/app/types/pack.types'

interface SalesFiltersProps {
    values: { from: string, to: string, pack: string, method: string, all: boolean }
    packs: IPackOption[]
    presets: { label: string, query: Record<string, string> }[]
}

// Filtros de /admin/sales: rango de fechas (con atajos), pack y método. Cambiar un filtro vuelve a la
// primera página.
export const SalesFilters = ({ values, packs, presets }: SalesFiltersProps) => {
    const router = useRouter()
    const [from, setFrom] = useState(values.from)
    const [to, setTo] = useState(values.to)

    const go = (next: Record<string, string>) => {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(next)) {
            if (value) params.set(key, value)
        }
        const qs = params.toString()
        router.push(qs ? `/admin/sales?${qs}` : '/admin/sales')
    }

    const keep = { pack: values.pack, method: values.method }
    const dates: Record<string, string> = values.all ? { all: '1' } : { from: values.from, to: values.to }
    const isActive = (query: Record<string, string>) =>
        query.all === '1' ? values.all : !values.all && query.from === values.from && query.to === values.to

    return (
        <div className='grid grid-cols-1 gap-3'>
            <div className='flex flex-wrap gap-2'>
                {presets.map((preset) => (
                    <button
                        key={preset.label}
                        type='button'
                        className={`rounded-full border px-3 py-1 text-xs cursor-pointer ${isActive(preset.query)
                            ? 'border-neutral-400 bg-neutral-700 font-bold'
                            : 'border-neutral-700 hover:bg-neutral-800'}`}
                        onClick={() => {
                            setFrom(preset.query.from ?? '')
                            setTo(preset.query.to ?? '')
                            go({ ...preset.query, ...keep })
                        }}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
            <form
                className='grid grid-cols-2 md:grid-cols-5 gap-3 items-end'
                onSubmit={(e) => {
                    e.preventDefault()
                    go({ from, to, ...keep })
                }}
            >
                <div>
                    <label htmlFor='sales_from' className='block text-xs font-medium mb-1'>Desde</label>
                    <input id='sales_from' type='date' className='w-full' value={from} max={to || undefined} onChange={(e) => { setFrom(e.currentTarget.value) }} />
                </div>
                <div>
                    <label htmlFor='sales_to' className='block text-xs font-medium mb-1'>Hasta</label>
                    <input id='sales_to' type='date' className='w-full' value={to} min={from || undefined} onChange={(e) => { setTo(e.currentTarget.value) }} />
                </div>
                <div>
                    <label htmlFor='sales_pack' className='block text-xs font-medium mb-1'>Pack</label>
                    <select
                        id='sales_pack'
                        className='w-full'
                        value={values.pack}
                        onChange={(e) => { go({ ...dates, pack: e.currentTarget.value, method: values.method }) }}
                    >
                        <option value=''>Todos</option>
                        {packs.map((p) => (
                            <option key={p.pack_id} value={p.pack_id}>{p.name} ({p.code})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor='sales_method' className='block text-xs font-medium mb-1'>Método</label>
                    <select
                        id='sales_method'
                        className='w-full'
                        value={values.method}
                        onChange={(e) => { go({ ...dates, pack: values.pack, method: e.currentTarget.value }) }}
                    >
                        <option value=''>Todos</option>
                        <option value='paypal'>PayPal</option>
                        <option value='coupon'>Cupón</option>
                    </select>
                </div>
                <button type='submit' className='btn-primary col-span-2 md:col-span-1' disabled={from === '' && to === ''}>
                    Aplicar fechas
                </button>
            </form>
        </div>
    )
}
