'use client'
import { useState } from 'react'
import Image from 'next/image'
import { FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminPage } from '@/src/app/types/page.types'
import { PAGE_TYPE } from '@/src/app/utils/page-access'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'
import { DialogDeletePage } from './dialog-delete-page'

interface PackPagesManagerProps {
    pages: IAdminPage[]
}

interface PageRowProps {
    page: IAdminPage
    onSaved: () => void
    onDeleteRequest: (page: IAdminPage) => void
}

// Una fila editable: número, tipo (gratis/pago) y estado (activa/inactiva), con su propio guardado.
const PageRow = ({ page, onSaved, onDeleteRequest }: PageRowProps) => {
    const { setAlert } = useAlert()
    const [num, setNum] = useState(page.num)
    const [pageTypeId, setPageTypeId] = useState(page.page_type_id)
    const [active, setActive] = useState(page.state === 1)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    const dirty = num !== page.num || pageTypeId !== page.page_type_id || active !== (page.state === 1)

    const handleSave = async () => {
        setError(null)
        setIsPending(true)
        try {
            const { data } = await API.patch<IResponse<{ page_id: number }>>('/api/pack/pages', {
                page_id: page.page_id,
                num,
                page_type_id: pageTypeId,
                state: active ? 1 : 0,
            })
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: 'Página actualizada correctamente' })
                onSaved()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <tr className='border-b border-neutral-800'>
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
                    value={num}
                    onChange={(e) => { setNum(e.currentTarget.value) }}
                    disabled={isPending}
                />
            </td>
            <td className='p-2'>
                <select
                    value={pageTypeId}
                    onChange={(e) => { setPageTypeId(Number(e.currentTarget.value)) }}
                    disabled={isPending}
                >
                    <option value={PAGE_TYPE.FREE}>Gratis</option>
                    <option value={PAGE_TYPE.REGISTERED}>Registrados</option>
                    <option value={PAGE_TYPE.BUY}>De pago</option>
                </select>
            </td>
            <td className='p-2'>
                <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => { setActive(e.currentTarget.checked) }}
                    disabled={isPending}
                />
            </td>
            <td className='p-2'>
                {error && <p className='text-red-500 text-xs pb-1'>{error}</p>}
                <div className='flex justify-end gap-2'>
                    <button
                        className='btn-primary'
                        type='button'
                        onClick={handleSave}
                        disabled={isPending || !dirty}
                    >
                        Guardar
                    </button>
                    <button
                        className='btn-primary-icon text-red-500'
                        type='button'
                        aria-label='Eliminar'
                        onClick={() => { onDeleteRequest(page) }}
                        disabled={isPending}
                    >
                        <FaTrash />
                    </button>
                </div>
            </td>
        </tr>
    )
}

export const PackPagesManager = ({ pages }: PackPagesManagerProps) => {
    const router = useRouter()
    const [deletingPage, setDeletingPage] = useState<IAdminPage | null>(null)

    const refresh = () => { router.refresh() }

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
                        ) : pages.map((page) => (
                            <PageRow
                                key={page.page_id}
                                page={page}
                                onSaved={refresh}
                                onDeleteRequest={setDeletingPage}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <DialogDeletePage
                open={deletingPage !== null}
                page={deletingPage}
                onClose={() => { setDeletingPage(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
