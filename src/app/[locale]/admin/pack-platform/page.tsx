import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryPlatform } from '@/src/app/repositories/platform.repository'
import { isNumber } from '@/src/app/utils/other'
import { PosterFilter } from '@/src/app/types/platform.types'
import { AdminPagination } from '../_components/pagination'
import { AdminBreadcrumb } from '../_components/breadcrumb'
import { PackPosterList } from './_components/pack-poster-list'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

const FILTERS: PosterFilter[] = ['all', 'with', 'without']

interface AdminPosterPageProps {
    searchParams: Promise<{
        page?: string
        /** all | with (con pósters) | without (sin pósters). */
        filter?: string
    }>
}

export default async function Page({ searchParams }: AdminPosterPageProps) {
    await requireAdminPage()
    const { page: pageParam, filter: filterParam } = await searchParams
    const requestedPage = pageParam !== undefined && isNumber(pageParam) ? Math.trunc(Number(pageParam)) : 1
    const filter: PosterFilter = FILTERS.includes(filterParam as PosterFilter) ? filterParam as PosterFilter : 'all'

    let { packs, total } = await repositoryPlatform.findPacksWithPosters(Math.max(1, requestedPage), PAGE_SIZE, filter)
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    // La página pedida excedía el total: se vuelve a pedir con la página válida más cercana.
    if (page !== requestedPage) {
        ({ packs, total } = await repositoryPlatform.findPacksWithPosters(page, PAGE_SIZE, filter))
    }

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Pósters' }]} />
            <div className='card'>
                <h1 className='text-center text-2xl md:text-3xl font-bold pb-1'>Pósters</h1>
                <p className='text-center text-sm text-neutral-400 pb-3'>
                    Imágenes de cada pack para otras plataformas. Se muestran debajo del botón comprar y redirigen a la publicación del pack en esa plataforma.
                </p>
                <PackPosterList packs={packs} filter={filter} />
                <AdminPagination
                    basePath='/admin/pack-platform'
                    page={page}
                    totalPages={totalPages}
                    query={filter !== 'all' ? { filter } : {}}
                />
            </div>
        </div>
    )
}
