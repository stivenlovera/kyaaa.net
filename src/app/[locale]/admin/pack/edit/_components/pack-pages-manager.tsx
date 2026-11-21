'use client'
import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPage, IFormPage } from '@/src/app/types/page.types'
import { PAGE_TYPE } from '@/src/app/utils/page-access'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'
import { DialogDeletePage } from './dialog-delete-page'

interface PackPagesManagerProps {
    pages: IAdminPage[]
}

// Valores editables de una fila.
interface PageDraft {
    num: string
    page_type_id: number
    active: boolean
}

const PAGE_TYPE_OPTIONS = [
    { value: PAGE_TYPE.FREE, label: 'Gratis' },
    { value: PAGE_TYPE.REGISTERED, label: 'Registrados' },
    { value: PAGE_TYPE.BUY, label: 'De pago' },
]

function draftOf(page: IAdminPage): PageDraft {
    return { num: page.num, page_type_id: page.page_type_id, active: page.state === 1 }
}

function isDirty(page: IAdminPage, draft: PageDraft): boolean {
    return draft.num !== page.num || draft.page_type_id !== page.page_type_id || draft.active !== (page.state === 1)
}

interface PageRowProps {
    page: IAdminPage
    draft: PageDraft
    dirty: boolean
    disabled: boolean
    onChange: (patch: Partial<PageDraft>) => void
    onDeleteRequest: (page: IAdminPage) => void
}

// Una fila editable: número, tipo (gratis/registrados/pago) y estado (activa/inactiva). Los cambios
// se acumulan en el gestor y se guardan todos juntos con "Guardar cambios".
const PageRow = ({ page, draft, dirty, disabled, onChange, onDeleteRequest }: PageRowProps) => (
    <tr className={`border-b border-neutral-800 ${dirty ? 'bg-amber-900/20' : ''}`}>
        <td className='p-2'>
            {page.url ? (
                <Image src={page.url} alt={`Página ${page.num}`} width={90} height={117} unoptimized />
            ) : (
                <span className='text-xs text-neutral-400'>Sin miniatura</span>
            )}
        </td>
        <td className='p-2'>
            <input
                className='w-20'
                value={draft.num}
                onChange={(e) => { onChange({ num: e.currentTarget.value }) }}
                disabled={disabled}
            />
        </td>
        <td className='p-2'>
            <select
                value={draft.page_type_id}
                onChange={(e) => { onChange({ page_type_id: Number(e.currentTarget.value) }) }}
                disabled={disabled}
            >
                {PAGE_TYPE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                ))}
            </select>
        </td>
        <td className='p-2'>
            <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => { onChange({ active: e.currentTarget.checked }) }}
                disabled={disabled}
            />
        </td>
        <td className='p-2'>
            <div className='flex items-center justify-end gap-2'>
                {dirty && <span className='text-xs text-amber-400'>Sin guardar</span>}
                <button
                    className='btn-primary-icon text-red-500'
                    type='button'
                    aria-label='Eliminar'
                    onClick={() => { onDeleteRequest(page) }}
                    disabled={disabled}
                >
                    <FaTrash />
                </button>
            </div>
        </td>
    </tr>
)

export const PackPagesManager = ({ pages }: PackPagesManagerProps) => {
    const router = useRouter()
    const { setAlert } = useAlert()
    const [deletingPage, setDeletingPage] = useState<IAdminPage | null>(null)
    // Solo las filas tocadas; el resto muestra lo que hay en la BD.
    const [edits, setEdits] = useState<Record<number, PageDraft>>({})
    const [error, setError] = useState<string | null>(null)
    // Guardado + router.refresh en una transición: los cambios locales se limpian a la vez que llegan
    // los datos nuevos, sin mostrar un instante los valores viejos.
    const [isPending, startTransition] = useTransition()

    const refresh = () => { router.refresh() }

    const draftFor = (page: IAdminPage) => edits[page.page_id] ?? draftOf(page)
    // Ignora ediciones de páginas que ya no están (p. ej. una borrada) o que volvieron a su valor original.
    const dirtyPages = pages.filter((page) => edits[page.page_id] && isDirty(page, edits[page.page_id]))

    const updateDraft = (page: IAdminPage, patch: Partial<PageDraft>) => {
        setError(null)
        setEdits((prev) => ({ ...prev, [page.page_id]: { ...(prev[page.page_id] ?? draftOf(page)), ...patch } }))
    }

    // Aviso del navegador al salir o recargar con cambios sin guardar.
    const hasChanges = dirtyPages.length > 0
    useEffect(() => {
        if (!hasChanges) {
            return
        }
        const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault() }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => { window.removeEventListener('beforeunload', onBeforeUnload) }
    }, [hasChanges])

    const handleSaveAll = () => startTransition(async () => {
        setError(null)
        try {
            const payload: IFormPage[] = dirtyPages.map((page) => {
                const draft = edits[page.page_id]
                return { page_id: page.page_id, num: draft.num, page_type_id: draft.page_type_id, state: draft.active ? 1 : 0 }
            })
            const { data } = await API.patch<IResponse<{ count: number }>>('/api/pack/pages/batch', { pages: payload })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: `${data.data.count} páginas actualizadas correctamente` })
                setEdits({})
                refresh()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        }
    })

    const handleDiscard = () => {
        setError(null)
        setEdits({})
    }

    return (
        <div>
            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Miniatura</th>
                            <th className='p-2'>Número</th>
                            <th className='p-2'>Tipo</th>
                            <th className='p-2'>Activa</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={5}>
                                    Este pack todavía no tiene páginas. Se suben con la herramienta markwater-kyaaa.
                                </td>
                            </tr>
                        ) : pages.map((page) => {
                            const draft = draftFor(page)
                            return (
                                <PageRow
                                    key={page.page_id}
                                    page={page}
                                    draft={draft}
                                    dirty={isDirty(page, draft)}
                                    disabled={isPending}
                                    onChange={(patch) => { updateDraft(page, patch) }}
                                    onDeleteRequest={setDeletingPage}
                                />
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {pages.length > 0 && (
                // Barra fija al pie de la pantalla: la lista puede ser larga.
                <div className='sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-700 bg-neutral-900 p-2'>
                    {error && <p className='text-red-500 text-sm mr-auto'>{error}</p>}
                    <span className='text-sm text-neutral-400'>
                        {hasChanges ? `${dirtyPages.length} páginas con cambios sin guardar` : 'Sin cambios'}
                    </span>
                    <button
                        className='btn-primary'
                        type='button'
                        onClick={handleDiscard}
                        disabled={isPending || !hasChanges}
                    >
                        Descartar
                    </button>
                    <button
                        className='btn-primary'
                        type='button'
                        onClick={handleSaveAll}
                        disabled={isPending || !hasChanges}
                    >
                        {isPending ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                </div>
            )}
            <DialogDeletePage
                open={deletingPage !== null}
                page={deletingPage}
                onClose={() => { setDeletingPage(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
