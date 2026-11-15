import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryPack } from '@/src/app/repositories/pack.repository'
import { repositoryPlatform } from '@/src/app/repositories/platform.repository'
import { AdminBreadcrumb } from '../../_components/breadcrumb'
import { PackPlatformsManager } from '../../pack/edit/_components/pack-platforms-manager'

export const dynamic = 'force-dynamic'

interface AdminPosterEditPageProps {
    searchParams: Promise<{
        code?: string
    }>
}

// Pósters de un pack: el mismo gestor que la sección "Pósters por plataforma" de /admin/pack/edit.
export default async function Page({ searchParams }: AdminPosterEditPageProps) {
    await requireAdminPage()
    const { code } = await searchParams
    if (code === undefined) {
        notFound()
    }

    const pack = await repositoryPack.findForEdit(code)
    if (pack === null) {
        notFound()
    }

    const [platforms, items] = await Promise.all([
        repositoryPlatform.findAll(),
        repositoryPlatform.findAllForAdmin(pack.pack_id),
    ])

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14 grid grid-cols-1 gap-4'>
            <AdminBreadcrumb items={[{ label: 'Pósters', href: '/admin/pack-platform' }, { label: pack.name }]} />
            <div className='card'>
                <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-3'>
                    <div>
                        <h1 className='text-2xl md:text-3xl font-bold pb-1'>{pack.name}</h1>
                        <p className='text-sm text-neutral-400'>{pack.pack_id}-{pack.code}</p>
                    </div>
                    <Link className='btn-primary whitespace-nowrap self-start' href={`/admin/pack/edit?code=${pack.code}`}>
                        Editar pack
                    </Link>
                </div>
                <h2 className='text-xl font-bold pb-1'>Pósters por plataforma</h2>
                <p className='text-sm text-neutral-400 pb-3'>Se muestran debajo del botón comprar y redirigen a la publicación del pack en cada plataforma. Usa imágenes aptas para esas plataformas (sin contenido adulto).</p>
                <PackPlatformsManager
                    pack_id={pack.pack_id}
                    platforms={platforms}
                    items={items}
                />
            </div>
        </div>
    )
}
