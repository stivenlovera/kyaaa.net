'use client'
import { safeNextPath } from '@/src/app/utils/login-redirect';
import Form from 'next/form'
import { useActionState } from 'react';
import { useRouter } from "@/src/app/layout/components/navigate/use-loading-router";
import { useAuth } from '@/src/providers/AuthContext';
import { IFormRegister, initialStateFormRegister } from '@/src/app/types/user.type';
import { actionFormRegister } from '@/src/app/actions/actionFormRegister';

export const FormRegister = ({ next }: { next?: string }) => {
    const router = useRouter();
    const { checkAuth } = useAuth()

    const action = async (prevState: IFormRegister, formData: FormData) => {
        const result = await actionFormRegister(prevState, formData)
        if (result.success) {
            checkAuth()
            router.push(safeNextPath(next))
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(action, initialStateFormRegister);

    return (
        <Form
            className='p-2'
            action={formAction}
        >
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label
                        htmlFor="name"
                        className="block text-xs font-medium mb-1">
                        Nombre completo
                    </label>
                    <input
                        id="nick"
                        className='w-full'
                        placeholder='Nombre completo'
                        name="name"
                        defaultValue={state?.fields?.name}
                        /* value={formRegister.name}
                        onChange={(e) => setFormRegister({ ...formRegister, name: e.target.value })} */
                        type="text"
                    />
                    {state?.errors?.name && <p className="text-red-500 text-xs pt-1">{state.errors.name}</p>}
                </div>
                <div>
                    <label
                        htmlFor="email"
                        className="block text-xs font-medium mb-1">
                        Email
                    </label>
                    <input
                        id="email"
                        className='w-full'
                        placeholder='Email'
                        type="email"
                        name="email"
                        autoComplete="off"
                        defaultValue={state?.fields?.email}
                    /* value={formRegister.email}
                    onChange={(e) => setFormRegister({ ...formRegister, email: e.target.value })} */
                    />
                    {state?.errors?.email && <p className="text-red-500 text-xs pt-1">{state.errors.email}</p>}
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="block text-xs font-medium mb-1">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        className="w-full"
                        placeholder='Contraseña'
                        type="password"
                        name="password"
                        autoComplete="off"
                        defaultValue={state?.fields?.password}
                    /* value={formRegister.password}
                    onChange={(e) => setFormRegister({ ...formRegister, password: e.target.value })} */
                    />
                    {state?.errors?.password && <p className="text-red-500 text-xs pt-1">{state.errors.password}</p>}
                </div>
                <div>
                    <label
                        htmlFor="confirm_password"
                        className="block text-xs font-medium mb-1">
                        Confirma tu contraseña
                    </label>
                    <input
                        id="confirm_password"
                        className="w-full"
                        placeholder=' Confirma tu contraseña'
                        type="password"
                        name="confirm_password"
                        autoComplete="off"
                        defaultValue={state?.fields?.confirm_password}
                    /* value={formRegister.confirm_password}
                    onChange={(e) => setFormRegister({ ...formRegister, confirm_password: e.target.value })} */
                    />
                    {state?.errors?.confirm_password && <p className="text-red-500 text-xs pt-1">{state.errors.confirm_password}</p>}
                </div>
                <div className="">
                    <div className='flex'>
                        <input
                            id="term_use"
                            placeholder='Confirma tu contraseña'
                            type="checkbox"
                            name="term_use"
                            defaultChecked={state?.fields?.term_use}
                        /*  
                         onChange={(e) => {
                             setFormRegister({ ...formRegister, term_use: e.target.checked })
                         }} */
                        />
                        <p className='px-2 text-sm'>
                            Acepto los términos y he leído la política de privacidad.
                        </p>

                    </div>
                    {state?.errors?.term_use && <p className="text-red-500 text-xs pt-1">{state.errors.term_use}</p>}
                </div>
            </div>
            <div className='text-left pt-4'>
                <button
                    className='btn-primary w-full'
                    type="submit"
                    disabled={isPending}
                >
                    <div className='flex flex-row'>
                        <p className='px-2'>Crear mi cuenta</p>
                    </div>
                </button>
            </div>
        </Form >
    )
}
