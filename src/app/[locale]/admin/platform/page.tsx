import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryPlatform } from '@/src/app/repositories/platform.repository'
import { isNumber } from '@/src/app/utils/other'
import { AdminPagination } from '../_components/pagination'
import { AdminBreadcrumb } from '../_components/breadcrumb'
import { PlatformList } from './_components/platform-list'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

interface AdminPlatformPageProps {
    searchParams: Promise<{
        page?: string
    }>
}

export default async function Page({ searchParams }: AdminPlatformPageProps) {
    await requireAdminPage()
    const { page: pageParam } = await searchParams
    const requestedPage = pageParam !== undefined && isNumber(pageParam) ? Math.trunc(Number(pageParam)) : 1

    let { platforms, total } = await repositoryPlatform.findPaginated(Math.max(1, requestedPage), PAGE_SIZE)
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    // La página pedida excedía el total: se vuelve a pedir con la página válida más cercana.
    if (page !== requestedPage) {
        ({ platforms, total } = await repositoryPlatform.findPaginated(page, PAGE_SIZE))
    }

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Plataformas' }]} />
            <div className='card'>
                <h1 className='text-center text-2xl md:text-3xl font-bold pb-3'>Plataformas</h1>
                <PlatformList platforms={platforms} />
                <AdminPagination basePath='/admin/platform' page={page} totalPages={totalPages} />
            </div>
        </div>
    )
}
