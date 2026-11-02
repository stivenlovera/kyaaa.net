import Dialog from '@/src/app/[locale]/_components/dialog'
import { IFormUpdateEmail, initialStateFieldsFormUpdateEmail } from '@/src/app/types/user.type';
import { actionFormUpdateEmail } from '@/src/app/actions/actionFormUpdateEmail';
import { useAlert } from '@/src/providers/alertProvider';
import Form from 'next/form';
import React, { useActionState, useState } from 'react'
interface DialogChangeEmailProps {
    openChangeEmail: boolean;
    onChangeEmail: (open: boolean) => void;
}
export const DialogChangeEmail = ({ openChangeEmail, onChangeEmail }: DialogChangeEmailProps) => {

    const [formUpdateEmail, setFormUpdateEmail] = useState<IFormUpdateEmail>(initialStateFieldsFormUpdateEmail)
    const { setAlert } = useAlert()

    const action = async (prevState: IFormUpdateEmail, formData: FormData) => {
        const result = await actionFormUpdateEmail(prevState, formData)
        if (result.success) {
            setAlert({
                message: "Email modificado correctamente",
                open: true,
                icon: "success"
            })
            setFormUpdateEmail(initialStateFieldsFormUpdateEmail)
            onChangeEmail(false)
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(action, formUpdateEmail);

    return (
        <Dialog
            isOpen={openChangeEmail}
            onClose={(() => { onChangeEmail(false) })}
            title="Modificar Email"
        >
            <Form action={formAction}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-medium mb-1">
                            Email actual
                        </label>
                        <input
                            id="email"
                            className='w-full'
                            placeholder='Correo electrónico actual'
                            name="email"
                            defaultValue={formUpdateEmail.fields.email}
                            onKeyUp={(e) => { setFormUpdateEmail({ ...formUpdateEmail, fields: { ...formUpdateEmail.fields, email: e.currentTarget.value } }) }}
                            type="email"
                            disabled={isPending}
                        />
                        {state?.errors?.email && <p className="text-red-500 text-xs pt-1">{state.errors.email}</p>}
                    </div>
                    <div>
                        <label
                            htmlFor="new_email"
                            className="block text-xs font-medium mb-1">
                            Nuevo email
                        </label>
                        <input
                            id="new_email"
                            className='w-full'
                            placeholder='Nuevo correo electrónico'
                            name="new_email"
                            defaultValue={formUpdateEmail.fields.new_email}
                            onKeyUp={(e) => { setFormUpdateEmail({ ...formUpdateEmail, fields: { ...formUpdateEmail.fields, new_email: e.currentTarget.value } }) }}
                            type="email"
                            disabled={isPending}
                        />
                        {state?.errors?.new_email && <p className="text-red-500 text-xs pt-1">{state.errors.new_email}</p>}
                    </div>
                    <div className='flex justify-between gap-3'>
                        <button
                            className="btn-primary w-full text-red-500"
                            type='button'
                            onClick={() => { onChangeEmail(false) }}
                            disabled={isPending}
                        >
                            Cerrar
                        </button>
                        <button
                            className="btn-primary w-full"
                            type='submit'
                            disabled={isPending}
                        >
                            Modificar
                        </button>
                    </div>
                </div>
            </Form>
        </Dialog>
    )
}
