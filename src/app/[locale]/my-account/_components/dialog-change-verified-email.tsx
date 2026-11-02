import Dialog from '@/src/app/[locale]/_components/dialog'
import { actionFormVerifiedEmail } from '@/src/app/actions/actionFormVerifiedEmail';
import { useAlert } from '@/src/providers/alertProvider';
import Form from 'next/form';
import React, { useActionState } from 'react'
interface DialogChangeEmailProps {
    openChangeEmail: boolean;
    onChangeEmail: (open: boolean) => void;
}
export const DialogChangeVerifiedEmail = ({ openChangeEmail, onChangeEmail }: DialogChangeEmailProps) => {

    const { setAlert } = useAlert()

    const action = async (prevState: { success: boolean }, formData: FormData) => {
        const result = await actionFormVerifiedEmail(prevState, formData)
        if (result.success) {
            setAlert({
                message: "Enlace enviado",
                open: true,
                icon: "success"
            })
            onChangeEmail(false)
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(action, { success: false });

    return (
        <Dialog
            isOpen={openChangeEmail}
            onClose={(() => { onChangeEmail(false) })}
            title="Verificar email"
        >
            <Form
                id="my-form"
                action={formAction}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        Se enviara un enlace a su correo para verificar, <br /> si no recibe el correo o no lo encuentra en la bandeja, revise en spam.
                    </div>
                    <input type="text" name='test' hidden />
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
                            type="submit"
                            disabled={isPending}
                        >
                            Enviar enlace
                        </button>
                    </div>
                </div>
            </Form>
        </Dialog>
    )
}
