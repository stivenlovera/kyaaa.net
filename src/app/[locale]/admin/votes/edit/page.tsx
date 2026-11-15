import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/src/app/utils/auth'
import { repositoryParticipate } from '@/src/app/repositories/participate.repository'
import { repositoryPack } from '@/src/app/repositories/pack.repository'
import { formatDay, isNumber } from '@/src/app/utils/other'
import { STATE_PACK_PARTICIPATE } from '@/src/app/utils/page-access'
import { AdminBreadcrumb } from '../../_components/breadcrumb'
import { ParticipatePacksManager } from './_components/participate-packs-manager'

export const dynamic = 'force-dynamic'

interface AdminParticipateEditPageProps {
    searchParams: Promise<{
        id?: string
    }>
}

export default async function Page({ searchParams }: AdminParticipateEditPageProps) {
    await requireAdminPage()
    const { id } = await searchParams
    if (id === undefined || !isNumber(id)) {
        notFound()
    }

    const participate_id = Math.trunc(Number(id))
    const participate = await repositoryParticipate.findById(participate_id)
    if (participate === null) {
        notFound()
    }

    const [items, packs] = await Promise.all([
        repositoryParticipate.findPacks(participate_id),
        // Solo se votan los packs en borrador (es lo que muestra /participate).
        repositoryPack.findOptions(STATE_PACK_PARTICIPATE),
    ])

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14 grid grid-cols-1 gap-4'>
            <AdminBreadcrumb items={[{ label: 'Participa', href: '/admin/votes' }, { label: participate.name }]} />
            <div className='card'>
                <h1 className='text-2xl md:text-3xl font-bold pb-1'>{participate.name}</h1>
                <p className='text-sm text-neutral-400'>
                    {formatDay(participate.start_date)} — {formatDay(participate.start_end)} · {participate.state_name} · {participate.total_votes} voto(s)
                </p>
            </div>
            <div className='card'>
                <h2 className='text-xl font-bold pb-1'>Packs en votación</h2>
                <p className='text-sm text-neutral-400 pb-3'>Los packs que los usuarios pueden votar en esta participación. Solo se pueden agregar packs en estado «borrador», que son los que se muestran en /participate. Un pack con votos no se puede quitar.</p>
                <ParticipatePacksManager participate_id={participate_id} packs={packs} items={items} />
            </div>
        </div>
    )
}
