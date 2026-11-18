import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryTicket } from '@/src/app/repositories/ticket.repository'
import { isTicketCategory, isTicketStatus } from '@/src/app/types/ticket.types'
import { isNumber } from '@/src/app/utils/other'
import { AdminPagination } from '../_components/pagination'
import { AdminBreadcrumb } from '../_components/breadcrumb'
import { TicketList } from './_components/ticket-list'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

interface AdminTicketPageProps {
    searchParams: Promise<{
        page?: string
        status?: string
        category?: string
    }>
}

export default async function Page({ searchParams }: AdminTicketPageProps) {
    await requireAdminPage()
    const { page: pageParam, status: statusParam, category: categoryParam } = await searchParams
    const requestedPage = pageParam !== undefined && isNumber(pageParam) ? Math.trunc(Number(pageParam)) : 1
    const status = isTicketStatus(statusParam) ? statusParam : undefined
    const category = isTicketCategory(categoryParam) ? categoryParam : undefined
    const filter = { status, category }

    let { tickets, total } = await repositoryTicket.findPaginated(Math.max(1, requestedPage), PAGE_SIZE, filter)
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    // La página pedida excedía el total: se vuelve a pedir con la página válida más cercana.
    if (page !== requestedPage) {
        ({ tickets, total } = await repositoryTicket.findPaginated(page, PAGE_SIZE, filter))
    }

    const query: Record<string, string> = {}
    if (status) query.status = status
    if (category) query.category = category

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-40 2xl:px-56 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Tickets' }]} />
            <div className='card'>
                <h1 className='text-center text-2xl md:text-3xl font-bold pb-3'>Tickets de soporte</h1>
                <TicketList tickets={tickets} total={total} status={status} category={category} />
                <AdminPagination basePath='/admin/ticket' page={page} totalPages={totalPages} query={query} />
            </div>
        </div>
    )
}
