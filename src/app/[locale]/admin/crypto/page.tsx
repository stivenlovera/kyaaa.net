import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryPaymentOrder } from '@/src/app/repositories/payment-order.repository'
import { AdminPaymentFilter, isAdminPaymentFilter } from '@/src/app/types/payment-order.types'
import { isNumber } from '@/src/app/utils/other'
import { AdminPagination } from '../_components/pagination'
import { AdminBreadcrumb } from '../_components/breadcrumb'
import { PaymentOrderList } from './_components/payment-order-list'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50
const DEFAULT_FILTER: AdminPaymentFilter = 'partial'

interface AdminCryptoPageProps {
    searchParams: Promise<{
        page?: string
        filter?: string
    }>
}

// Pagos con cripto (NOWPayments): sirve sobre todo para ver los parciales que no se entregaron solos y
// entregar el pack a mano. Las ventas ya entregadas están también en /admin/sales.
export default async function Page({ searchParams }: AdminCryptoPageProps) {
    await requireAdminPage()
    const { page: pageParam, filter: filterParam } = await searchParams
    const requestedPage = pageParam !== undefined && isNumber(pageParam) ? Math.trunc(Number(pageParam)) : 1
    const filter = isAdminPaymentFilter(filterParam) ? filterParam : DEFAULT_FILTER

    let { orders, total } = await repositoryPaymentOrder.findAdminPaginated(Math.max(1, requestedPage), PAGE_SIZE, filter)
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    // La página pedida excedía el total: se vuelve a pedir con la página válida más cercana.
    if (page !== requestedPage) {
        ({ orders, total } = await repositoryPaymentOrder.findAdminPaginated(page, PAGE_SIZE, filter))
    }

    const query: Record<string, string> = {}
    if (filter !== DEFAULT_FILTER) query.filter = filter

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-40 2xl:px-56 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Pagos cripto' }]} />
            <div className='card'>
                <h1 className='text-center text-2xl md:text-3xl font-bold pb-3'>Pagos cripto</h1>
                <PaymentOrderList orders={orders} total={total} filter={filter} />
                <AdminPagination basePath='/admin/crypto' page={page} totalPages={totalPages} query={query} />
            </div>
        </div>
    )
}
