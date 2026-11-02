import { requireAdminPage } from '@/src/app/utils/auth'
import Link from 'next/link'
import { AdminBreadcrumb } from '../../_components/breadcrumb'

export default async function Page() {
    await requireAdminPage()
    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14'>
            <AdminBreadcrumb items={[{ label: 'Packs', href: '/admin/pack' }, { label: 'Crear pack' }]} />
            <div className='flex justify-center'>
                <div className='card md:w-2xl w-full text-center'>
                    <h1 className='text-2xl md:text-3xl font-bold pb-3'>Crear pack</h1>
                    <p className='pb-4'>
                        Esta página está pensada para la creación completa de un pack: etiquetas, personajes, series, autores, idiomas y páginas/imágenes.
                        Por ahora, para crear un pack usa el botón &quot;Crear pack&quot; del listado.
                    </p>
                    <Link className='btn-primary inline-block' href='/admin/pack'>Volver al listado</Link>
                </div>
            </div>
        </div>
    )
}
