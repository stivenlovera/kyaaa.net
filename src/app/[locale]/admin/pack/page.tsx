import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryPack } from '@/src/app/repositories/pack.repository'
import { repositoryStatePack } from '@/src/app/repositories/state-pack.repository'
import { isNumber } from '@/src/app/utils/other'
import { AdminPagination } from '../_components/pagination'
import { AdminBreadcrumb } from '../_components/breadcrumb'
import { PackList } from './_components/pack-list'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

interface AdminPackPageProps {
    searchParams: Promise<{
        page?: string
    }>
}

export default async function Page({ searchParams }: AdminPackPageProps) {
    await requireAdminPage()
    const { page: pageParam } = await searchParams
    const requestedPage = pageParam !== undefined && isNumber(pageParam) ? Math.trunc(Number(pageParam)) : 1

    let { packs: pagePacks, total } = await repositoryPack.findPaginated(Math.max(1, requestedPage), PAGE_SIZE)
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    // La página pedida excedía el total: se vuelve a pedir con la página válida más cercana.
    if (page !== requestedPage) {
        ({ packs: pagePacks, total } = await repositoryPack.findPaginated(page, PAGE_SIZE))
    }
    const states = await repositoryStatePack.findAll()

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Packs' }]} />
            <div className='card'>
                <h1 className='text-center text-2xl md:text-3xl font-bold pb-3'>Packs</h1>
                <PackList packs={pagePacks} states={states} />
                <AdminPagination basePath='/admin/pack' page={page} totalPages={totalPages} />
            </div>
        </div>
    )
}
