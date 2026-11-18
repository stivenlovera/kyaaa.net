'use client'
import { useState } from 'react'
import moment from 'moment'
import { FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { useRouter } from '@/src/i18n/navigation'
import { IAdminAuthor } from '@/src/app/types/author.types'
import { DialogAuthorForm } from './dialog-author-form'
import { DialogDeleteAuthor } from './dialog-delete-author'

interface AuthorListProps {
    authors: IAdminAuthor[]
}

export const AuthorList = ({ authors }: AuthorListProps) => {
    const router = useRouter()
    const [editingAuthor, setEditingAuthor] = useState<IAdminAuthor | null | undefined>(undefined)
    const [deletingAuthor, setDeletingAuthor] = useState<IAdminAuthor | null>(null)

    const refresh = () => { router.refresh() }

    return (
        <div>
            <div className='flex justify-end pb-3'>
                <button
                    className='btn-primary flex'
                    type='button'
                    onClick={() => { setEditingAuthor(null) }}
                >
                    <FaPlus /> Crear autor
                </button>
            </div>
            <div className='overflow-x-auto'>
                <table className='w-full text-left'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Nombre</th>
                            <th className='p-2'>Slug</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Actualizado</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {authors.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={5}>No hay autores registrados.</td>
                            </tr>
                        ) : authors.map((author) => (
                            <tr key={author.author_id} className='border-b border-neutral-800'>
                                <td className='p-2'>{author.name}</td>
                                <td className='p-2'>{author.slug}</td>
                                <td className='p-2'>{author.state === 1 ? 'Activo' : 'Inactivo'}</td>
                                <td className='p-2'>{author.update_at ? moment(author.update_at).format('DD/MM/yyyy hh:mm') : ''}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end gap-2'>
                                        <button
                                            className='btn-primary-icon'
                                            type='button'
                                            aria-label='Editar'
                                            onClick={() => { setEditingAuthor(author) }}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            className='btn-primary-icon text-red-500'
                                            type='button'
                                            aria-label='Eliminar'
                                            onClick={() => { setDeletingAuthor(author) }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <DialogAuthorForm
                open={editingAuthor !== undefined}
                author={editingAuthor}
                onClose={() => { setEditingAuthor(undefined) }}
                onSaved={refresh}
            />
            <DialogDeleteAuthor
                open={deletingAuthor !== null}
                author={deletingAuthor}
                onClose={() => { setDeletingAuthor(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
