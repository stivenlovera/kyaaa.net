import Link from 'next/link'
import { FaFileCsv } from 'react-icons/fa6'
import { requireAdminPage } from '@/src/app/utils/auth'
import { repositorySales } from '@/src/app/repositories/sales.repository'
import { repositoryPack } from '@/src/app/repositories/pack.repository'
import { parseSalesFilter, salesPresets, SalesQuery } from '@/src/app/utils/sales-filter'
import { isNumber } from '@/src/app/utils/other'
import { LocalDate } from '@/src/app/components/local-date'
import { AdminPagination } from '../_components/pagination'
import { AdminBreadcrumb } from '../_components/breadcrumb'
import { SalesFilters } from './_components/sales-filters'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const money = (value: number) => `$${value.toFixed(2)}`

interface AdminSalesPageProps {
    searchParams: Promise<SalesQuery & { page?: string }>
}

export default async function Page({ searchParams }: AdminSalesPageProps) {
    await requireAdminPage()
    const { page: pageParam, ...params } = await searchParams
    const { filter, values, query } = parseSalesFilter(params)
    const requestedPage = pageParam !== undefined && isNumber(pageParam) ? Math.trunc(Number(pageParam)) : 1

    const [summary, topPacks, packs] = await Promise.all([
        repositorySales.summary(filter),
        repositorySales.topPacks(filter),
        repositoryPack.findOptions(),
    ])
    let { sales, total } = await repositorySales.findPaginated(Math.max(1, requestedPage), PAGE_SIZE, filter)
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    // La página pedida excedía el total: se vuelve a pedir con la página válida más cercana.
    if (page !== requestedPage) {
        ({ sales, total } = await repositorySales.findPaginated(page, PAGE_SIZE, filter))
    }
    const exportHref = `/api/sales/export?${new URLSearchParams(query).toString()}`

    const cards = [
        { label: 'Ventas pagadas', value: String(summary.sales) },
        { label: 'Bruto', value: money(summary.gross), hint: 'Lo que pagaron los compradores' },
        { label: 'Comisión', value: money(summary.fee), hint: 'PayPal; la de NOWPayments no se incluye' },
        { label: 'Neto', value: money(summary.net), hint: 'Lo que te queda' },
        { label: 'Cupones canjeados', value: String(summary.coupons) },
    ]

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-40 2xl:px-56 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Ventas' }]} />
            <div className='card grid grid-cols-1 gap-4'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <h1 className='text-2xl md:text-3xl font-bold'>Ventas</h1>
                    {/* <a> y no <Link>: es una descarga, no una navegación. */}
                    <a href={exportHref} className='btn-primary'>
                        <FaFileCsv aria-hidden />
                        Exportar CSV
                    </a>
                </div>

                <SalesFilters values={values} packs={packs} presets={salesPresets()} />

                <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3'>
                    {cards.map((card) => (
                        <div key={card.label} className='rounded-lg border border-neutral-700 bg-neutral-900 p-3'>
                            <p className='text-xs text-neutral-400'>{card.label}</p>
                            <p className='text-xl font-bold tabular-nums'>{card.value}</p>
                            {card.hint && <p className='text-xs text-neutral-500'>{card.hint}</p>}
                        </div>
                    ))}
                </div>

                {topPacks.length > 0 && (
                    <div>
                        <h2 className='text-sm font-bold pb-2'>Packs más vendidos</h2>
                        <ol className='grid grid-cols-1 gap-1 text-sm'>
                            {topPacks.map((top, i) => (
                                <li key={top.pack.pack_id} className='flex items-center gap-3'>
                                    <span className='w-5 text-right text-neutral-400'>{i + 1}.</span>
                                    <Link href={`/pack/${top.pack.code}`} className='flex-1 truncate hover:underline'>{top.pack.name}</Link>
                                    <span className='tabular-nums'>{top.sales} venta(s)</span>
                                    <span className='w-20 text-right tabular-nums'>{money(top.gross)}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                <div>
                    <p className='text-xs text-neutral-400 pb-2'>{total} registro(s)</p>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left text-sm'>
                            <thead>
                                <tr className='border-b border-neutral-700'>
                                    <th className='p-2'>Fecha</th>
                                    <th className='p-2'>Pack</th>
                                    <th className='p-2'>Comprador</th>
                                    <th className='p-2'>Método</th>
                                    <th className='p-2 text-right'>Bruto</th>
                                    <th className='p-2 text-right'>Comisión</th>
                                    <th className='p-2 text-right'>Neto</th>
                                    <th className='p-2'>Transacción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.length === 0 ? (
                                    <tr>
                                        <td className='p-2' colSpan={8}>No hay ventas en este periodo.</td>
                                    </tr>
                                ) : sales.map((sale) => (
                                    <tr key={`${sale.pack.pack_id}-${sale.user.user_id}-${sale.method}`} className='border-b border-neutral-800'>
                                        <td className='p-2 whitespace-nowrap text-xs'><LocalDate date={sale.create_at} /></td>
                                        <td className='p-2 max-w-56 truncate'>
                                            <Link href={`/pack/${sale.pack.code}`} className='hover:underline'>{sale.pack.name}</Link>
                                        </td>
                                        <td className='p-2'>
                                            {sale.user.nick}
                                            <span className='block text-xs text-neutral-400'>{sale.user.email}</span>
                                        </td>
                                        <td className='p-2 whitespace-nowrap'>{sale.method === 'coupon' ? 'Cupón' : sale.method === 'nowpayments' ? 'Cripto' : 'PayPal'}</td>
                                        <td className='p-2 text-right tabular-nums'>{money(sale.gross)}</td>
                                        <td className='p-2 text-right tabular-nums text-neutral-400'>{money(sale.fee)}</td>
                                        <td className='p-2 text-right tabular-nums font-bold'>{money(sale.net)}</td>
                                        <td className='p-2 font-mono text-xs break-all'>{sale.transaction}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AdminPagination basePath='/admin/sales' page={page} totalPages={totalPages} query={query} />
            </div>
        </div>
    )
}
