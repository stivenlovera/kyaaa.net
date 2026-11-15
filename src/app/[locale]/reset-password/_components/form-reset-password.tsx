'use client'
import { IFormUpdatePassword, initialStateFieldsFormUpdatePassword } from '@/src/app/types/user.type';
import { actionFormNewPassword } from '@/src/app/actions/actionFormNewPassword';
import { useAlert } from '@/src/providers/alertProvider';
import Form from 'next/form';
import { useRouter } from "@/src/app/layout/components/navigate/use-loading-router";
import React, { useActionState, useState } from 'react'

interface FormResetPasswordProps {
    email: string
    code: string
}

export const FormResetPassword = ({ email, code }: FormResetPasswordProps) => {
    const [formChangePassword, setFormChangePassword] = useState<IFormUpdatePassword>(initialStateFieldsFormUpdatePassword);
    const { setAlert } = useAlert()
    const router = useRouter()

    const action = async (prevState: IFormUpdatePassword, formData: FormData) => {
        const result = await actionFormNewPassword(prevState, formData)
        if (result.success) {
            setFormChangePassword(initialStateFieldsFormUpdatePassword)
            setAlert({
                message: "Contraseña establecida correctamenta",
                open: true,
                icon: "success"
            })
            router.push('/')
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(action, formChangePassword);
    return (
        <Form action={formAction}>
            <div className="grid grid-cols-1 gap-4">
                <div>
                    Establecer nueva contraseña para el usuario con email: {email}
                </div>
                <input
                    name="code"
                    defaultValue={code}
                    type="password"
                    disabled={isPending}
                    hidden
                />
                <div>
                    <label
                        htmlFor="new_password"
                        className="block text-xs font-medium mb-1">
                        Nueva contraseña
                    </label>
                    <input
                        id="new_password"
                        className='w-full'
                        placeholder='Nuevo contraseña'
                        name="new_password"
                        defaultValue={formChangePassword.fields.new_password}
                        onKeyUp={(e) => { setFormChangePassword({ ...formChangePassword, fields: { ...formChangePassword.fields, new_password: e.currentTarget.value } }) }}
                        type="password"
                        disabled={isPending}
                    />
                    {state?.errors?.new_password && <p className="text-red-500 text-xs pt-1">{state.errors.new_password}</p>}
                </div>
                <div>
                    <label
                        htmlFor="confirm_password"
                        className="block text-xs font-medium mb-1">
                        Confirma contraseña
                    </label>
                    <input
                        id="confirm_password"
                        className='w-full'
                        placeholder='Confirma contraseña'
                        name="confirm_password"
                        defaultValue={formChangePassword.fields.confirm_password}
                        onKeyUp={(e) => { setFormChangePassword({ ...formChangePassword, fields: { ...formChangePassword.fields, confirm_password: e.currentTarget.value } }) }}
                        type="password"
                        disabled={isPending}
                    />
                    {state?.errors?.confirm_password && <p className="text-red-500 text-xs pt-1">{state.errors.confirm_password}</p>}
                </div>
                <div className='flex justify-between gap-3'>
                    <button
                        id="dropdown-button"
                        className="btn-primary w-full"
                        disabled={isPending}
                        type='submit'
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </Form>
    )
}
