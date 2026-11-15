'use client'
import { useEffect, useState } from 'react'
import Dialog from '@/src/app/[locale]/_components/dialog'
import { useAlert } from '@/src/providers/alertProvider'
import { IAdminUser, IFormAdminUser } from '@/src/app/types/admin-user.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'

interface DialogUserFormProps {
    open: boolean
    onClose: () => void
    /** Usuario a editar; null/undefined para crear uno nuevo. */
    user?: IAdminUser | null
    /** Es la cuenta con la sesión abierta: no puede quitarse el rol de admin ni desactivarse. */
    isSelf: boolean
    onSaved: () => void
}

const emptyForm = { name: '', nick: '', email: '', password: '', state: true, verified: false, is_admin: false }

export const DialogUserForm = ({ open, onClose, user, isSelf, onSaved }: DialogUserFormProps) => {
    const { setAlert } = useAlert()
    const isEdit = user !== null && user !== undefined
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    // Reinicia el formulario cada vez que se abre, con los datos del usuario si es edición.
    useEffect(() => {
        if (open) {
            setForm(isEdit
                ? {
                    name: user!.name,
                    nick: user!.nick,
                    email: user!.email,
                    password: '',
                    state: user!.state === 1,
                    verified: user!.verified_email !== null,
                    is_admin: user!.is_admin,
                }
                : emptyForm)
            setError(null)
        }
    }, [open, user, isEdit])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        setIsPending(true)
        try {
            const body: IFormAdminUser = {
                user_id: user?.user_id,
                name: form.name,
                nick: form.nick,
                email: form.email,
                password: form.password === '' ? undefined : form.password,
                state: form.state ? 1 : 0,
                verified: form.verified,
                is_admin: form.is_admin,
            }
            const { data } = isEdit
                ? await API.patch<IResponse<IAdminUser>>('/api/admin/user', body)
                : await API.post<IResponse<IAdminUser>>('/api/admin/user', body)
            if (data.success) {
                setAlert({ open: true, icon: 'success', message: isEdit ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente' })
                onSaved()
                onClose()
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error del servidor')
        } finally {
            setIsPending(false)
        }
    }

    const text = (field: 'name' | 'nick' | 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value
        setForm((f) => ({ ...f, [field]: value }))
    }
    const check = (field: 'state' | 'verified' | 'is_admin') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.checked
        setForm((f) => ({ ...f, [field]: value }))
    }

    return (
        <Dialog isOpen={open} onClose={onClose} title={isEdit ? 'Editar usuario' : 'Crear usuario'} panelClassName='w-full md:w-[32rem] max-h-[90vh] overflow-y-auto'>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="user_name" className="block text-xs font-medium mb-1">Nombre</label>
                        <input id="user_name" className='w-full' value={form.name} onChange={text('name')} disabled={isPending} required autoFocus />
                    </div>
                    <div>
                        <label htmlFor="user_nick" className="block text-xs font-medium mb-1">Nick</label>
                        <input id="user_nick" className='w-full' value={form.nick} onChange={text('nick')} disabled={isPending} required />
                    </div>
                    <div className='sm:col-span-2'>
                        <label htmlFor="user_email" className="block text-xs font-medium mb-1">Email</label>
                        <input id="user_email" className='w-full' type='email' value={form.email} onChange={text('email')} disabled={isPending} required />
                    </div>
                    <div className='sm:col-span-2'>
                        <label htmlFor="user_password" className="block text-xs font-medium mb-1">
                            {isEdit ? 'Nueva contraseña (deja vacío para mantener la actual)' : 'Contraseña'}
                        </label>
                        <input
                            id="user_password"
                            className='w-full'
                            type='password'
                            autoComplete='new-password'
                            minLength={5}
                            maxLength={100}
                            value={form.password}
                            onChange={text('password')}
                            disabled={isPending}
                            required={!isEdit}
                        />
                    </div>
                    <div className='sm:col-span-2 grid grid-cols-1 gap-2'>
                        <label className='flex items-center gap-2 text-sm'>
                            <input type="checkbox" checked={form.verified} onChange={check('verified')} disabled={isPending} />
                            Correo verificado <span className='text-neutral-400'>(necesario para votar en /participate)</span>
                        </label>
                        <label className='flex items-center gap-2 text-sm'>
                            <input type="checkbox" checked={form.is_admin} onChange={check('is_admin')} disabled={isPending || isSelf} />
                            Administrador <span className='text-neutral-400'>(acceso a /admin)</span>
                        </label>
                        <label className='flex items-center gap-2 text-sm'>
                            <input type="checkbox" checked={form.state} onChange={check('state')} disabled={isPending || isSelf} />
                            Activo
                        </label>
                        {isSelf && <p className='text-xs text-neutral-400'>Es tu cuenta: no puedes quitarte el rol de administrador ni desactivarla.</p>}
                    </div>
                    {error && <p className="text-red-500 text-xs sm:col-span-2">{error}</p>}
                    <div className='flex justify-between gap-3 sm:col-span-2'>
                        <button className="btn-primary w-full text-red-500" type='button' onClick={onClose} disabled={isPending}>
                            Cerrar
                        </button>
                        <button className="btn-primary w-full" type='submit' disabled={isPending}>
                            {isEdit ? 'Guardar' : 'Crear'}
                        </button>
                    </div>
                </div>
            </form>
        </Dialog>
    )
}
