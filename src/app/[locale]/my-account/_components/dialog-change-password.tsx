import Dialog from '@/src/app/[locale]/_components/dialog'
import { IFormUpdatePassword, initialStateFieldsFormUpdatePassword } from '@/src/app/types/user.type';
import { actionFormUpdatePassword } from '@/src/app/actions/actionFormUpdatePassword';
import { useAlert } from '@/src/providers/alertProvider';
import Form from 'next/form';
import React, { useActionState, useState } from 'react'
interface DialogChangePasswordProps {
    openChangePassword: boolean;
    onChangePassword: (open: boolean) => void;
}
export const DialogChangePassword = ({ openChangePassword, onChangePassword }: DialogChangePasswordProps) => {

    const [formChangePassword, setFormChangePassword] = useState<IFormUpdatePassword>(initialStateFieldsFormUpdatePassword);
    const { setAlert } = useAlert()

    const action = async (prevState: IFormUpdatePassword, formData: FormData) => {
        const result = await actionFormUpdatePassword(prevState, formData)
        if (result.success) {
            setFormChangePassword(initialStateFieldsFormUpdatePassword)
            setAlert({
                message: "Contraseña modificada correctamente",
                open: true,
                icon: "success"
            })
            onChangePassword(false)

        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(action, formChangePassword);

    return (
        <Dialog
            isOpen={openChangePassword}
            onClose={(() => { onChangePassword(false) })}
            title="Modificar Contraseña"
        >
            <Form action={formAction}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label
                            htmlFor="current_password"
                            className="block text-xs font-medium mb-1">
                            Contraseña actual
                        </label>
                        <input
                            id="nick"
                            className='w-full'
                            placeholder='Contraseña actual'
                            name="current_password"
                            defaultValue={formChangePassword.fields.current_password}
                            onKeyUp={(e) => { setFormChangePassword({ ...formChangePassword, fields: { ...formChangePassword.fields, current_password: e.currentTarget.value } }) }}
                            type="password"
                            disabled={isPending}
                        />
                        {state?.errors?.current_password && <p className="text-red-500 text-xs pt-1">{state.errors.current_password}</p>}
                    </div>
                    <div>
                        <label
                            htmlFor="new_password"
                            className="block text-xs font-medium mb-1">
                            Nuevo contraseña
                        </label>
                        <input
                            id="nick"
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
                            htmlFor="name"
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
                            className="btn-primary w-full text-red-500"
                            type='button'
                            onClick={() => { onChangePassword(false) }}
                            disabled={isPending}
                        >
                            Cerrar
                        </button>
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
        </Dialog>
    )
}