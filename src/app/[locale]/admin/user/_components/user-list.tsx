'use client'
import { useState } from 'react'
import moment from 'moment'
import { usePathname, useRouter } from 'next/navigation'
import { FaMagnifyingGlass, FaPen, FaPlus, FaTrash } from 'react-icons/fa6'
import { IAdminUser } from '@/src/app/types/admin-user.types'
import { DialogUserForm } from './dialog-user-form'
import { DialogDeleteUser } from './dialog-delete-user'

interface UserListProps {
    users: IAdminUser[]
    total: number
    search: string
    /** Usuario con la sesión abierta: no puede quitarse el rol, desactivarse ni eliminarse. */
    currentUserId: number
}

export const UserList = ({ users, total, search, currentUserId }: UserListProps) => {
    // next/navigation: el pathname ya incluye el prefijo de idioma, así la búsqueda lo conserva.
    const router = useRouter()
    const pathname = usePathname()
    const [query, setQuery] = useState(search)
    const [editingUser, setEditingUser] = useState<IAdminUser | null | undefined>(undefined)
    const [deletingUser, setDeletingUser] = useState<IAdminUser | null>(null)

    const refresh = () => { router.refresh() }

    return (
        <div>
            <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-3'>
                <form
                    className='flex items-end gap-2 w-full sm:w-96'
                    onSubmit={(e) => {
                        e.preventDefault()
                        const q = query.trim()
                        router.push(q === '' ? pathname : `${pathname}?q=${encodeURIComponent(q)}`)
                    }}
                >
                    <div className='flex-1'>
                        <label htmlFor='user_search' className='block text-xs font-medium mb-1'>Buscar por nombre, nick o email</label>
                        <input
                            id='user_search'
                            className='w-full'
                            type='search'
                            value={query}
                            onChange={(e) => { setQuery(e.currentTarget.value) }}
                        />
                    </div>
                    <button className='btn-primary-icon' type='submit' aria-label='Buscar' title='Buscar'>
                        <FaMagnifyingGlass />
                    </button>
                </form>
                <button
                    className='btn-primary flex'
                    type='button'
                    onClick={() => { setEditingUser(null) }}
                >
                    <FaPlus /> Crear usuario
                </button>
            </div>
            <p className='text-xs text-neutral-400 pb-2'>
                {total} usuario(s){search !== '' && ` para «${search}»`}
            </p>
            <div className='overflow-x-auto'>
                <table className='w-full text-left text-sm'>
                    <thead>
                        <tr className='border-b border-neutral-700'>
                            <th className='p-2'>Usuario</th>
                            <th className='p-2'>Email</th>
                            <th className='p-2'>Correo</th>
                            <th className='p-2'>Rol</th>
                            <th className='p-2'>Estado</th>
                            <th className='p-2'>Compras</th>
                            <th className='p-2'>Registrado</th>
                            <th className='p-2'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td className='p-2' colSpan={8}>No hay usuarios para mostrar.</td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.user_id} className='border-b border-neutral-800'>
                                <td className='p-2'>
                                    {user.name}
                                    {user.user_id === currentUserId && <span className='text-xs text-neutral-400'> (tú)</span>}
                                    <span className='block text-xs text-neutral-400'>{user.nick}</span>
                                </td>
                                <td className='p-2 max-w-56 truncate'>{user.email}</td>
                                <td className='p-2 whitespace-nowrap'>
                                    {user.verified_email
                                        ? <span title={moment(user.verified_email).format('DD/MM/yyyy hh:mm')}>Verificado</span>
                                        : <span className='text-yellow-500'>Sin verificar</span>}
                                </td>
                                <td className='p-2'>{user.is_admin ? 'Admin' : 'Usuario'}</td>
                                <td className='p-2'>{user.state === 1 ? 'Activo' : <span className='text-neutral-500'>Inactivo</span>}</td>
                                <td className='p-2'>{user.total_buys}</td>
                                <td className='p-2 whitespace-nowrap'>{moment(user.create_at).format('DD/MM/yyyy')}</td>
                                <td className='p-2'>
                                    <div className='flex justify-end gap-2'>
                                        <button
                                            className='btn-primary-icon'
                                            type='button'
                                            aria-label='Editar'
                                            title='Editar'
                                            onClick={() => { setEditingUser(user) }}
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            className='btn-primary-icon text-red-500 disabled:opacity-40'
                                            type='button'
                                            aria-label='Eliminar'
                                            title={user.user_id === currentUserId ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}
                                            disabled={user.user_id === currentUserId}
                                            onClick={() => { setDeletingUser(user) }}
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
            <DialogUserForm
                open={editingUser !== undefined}
                user={editingUser}
                isSelf={editingUser?.user_id === currentUserId}
                onClose={() => { setEditingUser(undefined) }}
                onSaved={refresh}
            />
            <DialogDeleteUser
                open={deletingUser !== null}
                user={deletingUser}
                onClose={() => { setDeletingUser(null) }}
                onDeleted={refresh}
            />
        </div>
    )
}
