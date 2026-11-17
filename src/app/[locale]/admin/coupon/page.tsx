import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryCoupon } from '@/src/app/repositories/coupon.repository'
import { repositoryPack } from '@/src/app/repositories/pack.repository'
import { CouponStatus } from '@/src/app/types/coupon.types'
import { isNumber } from '@/src/app/utils/other'
import { AdminPagination } from '../_components/pagination'
import { AdminBreadcrumb } from '../_components/breadcrumb'
import { CouponList } from './_components/coupon-list'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50
const STATUSES: CouponStatus[] = ['free', 'redeemed', 'expired']

interface AdminCouponPageProps {
    searchParams: Promise<{
        page?: string
        status?: string
        pack?: string
    }>
}

export default async function Page({ searchParams }: AdminCouponPageProps) {
    await requireAdminPage()
    const { page: pageParam, status: statusParam, pack: packParam } = await searchParams
    const requestedPage = pageParam !== undefined && isNumber(pageParam) ? Math.trunc(Number(pageParam)) : 1
    const status = STATUSES.find((s) => s === statusParam)
    const pack_id = packParam !== undefined && isNumber(packParam) ? Number(packParam) : undefined
    const filter = { status, pack_id }

    let { coupons, total } = await repositoryCoupon.findPaginated(Math.max(1, requestedPage), PAGE_SIZE, filter)
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    // La página pedida excedía el total: se vuelve a pedir con la página válida más cercana.
    if (page !== requestedPage) {
        ({ coupons, total } = await repositoryCoupon.findPaginated(page, PAGE_SIZE, filter))
    }
    const packs = await repositoryPack.findOptions()

    const query: Record<string, string> = {}
    if (status) query.status = status
    if (pack_id !== undefined) query.pack = String(pack_id)

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-40 2xl:px-56 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Cupones' }]} />
            <div className='card'>
                <h1 className='text-center text-2xl md:text-3xl font-bold pb-3'>Cupones</h1>
                <CouponList coupons={coupons} total={total} packs={packs} status={status} packId={pack_id} />
                <AdminPagination basePath='/admin/coupon' page={page} totalPages={totalPages} query={query} />
            </div>
        </div>
    )
}
