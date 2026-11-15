import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryAdminUser } from '@/src/app/repositories/admin-user.repository'
import { isNumber } from '@/src/app/utils/other'
import { AdminPagination } from '../_components/pagination'
import { AdminBreadcrumb } from '../_components/breadcrumb'
import { UserList } from './_components/user-list'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

interface AdminUserPageProps {
    searchParams: Promise<{
        page?: string
        /** Búsqueda por nombre, nick o email. */
        q?: string
    }>
}

export default async function Page({ searchParams }: AdminUserPageProps) {
    const admin = await requireAdminPage()
    const { page: pageParam, q } = await searchParams
    const search = q?.trim() ? q.trim() : undefined
    const requestedPage = pageParam !== undefined && isNumber(pageParam) ? Math.trunc(Number(pageParam)) : 1

    let { users, total } = await repositoryAdminUser.findPaginated(Math.max(1, requestedPage), PAGE_SIZE, search)
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    // La página pedida excedía el total: se vuelve a pedir con la página válida más cercana.
    if (page !== requestedPage) {
        ({ users, total } = await repositoryAdminUser.findPaginated(page, PAGE_SIZE, search))
    }

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Usuarios' }]} />
            <div className='card'>
                <h1 className='text-center text-2xl md:text-3xl font-bold pb-3'>Usuarios</h1>
                <UserList users={users} total={total} search={search ?? ''} currentUserId={admin.user_id} />
                <AdminPagination
                    basePath='/admin/user'
                    page={page}
                    totalPages={totalPages}
                    query={search ? { q: search } : {}}
                />
            </div>
        </div>
    )
}
