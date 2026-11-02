import React, { useActionState, useState } from 'react'
import Dialog from '../../_components/dialog'
import Form from 'next/form'
import { IFormResetPassword, initialStateFieldsFormResetPassword } from '@/src/app/types/user.type';
import { actionFormResetPassword } from '@/src/app/actions/actionFormResetPassword';
import { useAlert } from '@/src/providers/alertProvider';

interface DialogResetPasswordProps {
  openResetPassword: boolean;
  onResetPassword: (open: boolean) => void;
}

export const DialogResetPassword = ({ openResetPassword, onResetPassword }: DialogResetPasswordProps) => {

  const [formResetPassword, setFormResetPassword] = useState<IFormResetPassword>(initialStateFieldsFormResetPassword);
  const { setAlert } = useAlert()

  const action = async (prevState: IFormResetPassword, formData: FormData) => {
    const result = await actionFormResetPassword(prevState, formData)
    if (result.success) {
        setAlert({
            message: "Enlace enviado",
            open: true,
            icon: "success"
        })
        setFormResetPassword(initialStateFieldsFormResetPassword)
        onResetPassword(false)
    }
    return result;
  }

  const [state, formAction, isPending] = useActionState(action, formResetPassword);

  return (
    <Dialog
      isOpen={openResetPassword}
      onClose={(() => { onResetPassword(false) })}
      title="Recuperar contraseña"
    >
      <Form action={formAction}>
        <div className="grid grid-cols-1 gap-4">
          <div>
            Se enviara un enlace a su correo electrónico para modificar su contraseña.
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
              placeholder='Correo electrónico'
              name="email"
              defaultValue={formResetPassword.fields.email}
              onKeyUp={(e) => { setFormResetPassword({ ...formResetPassword, fields: { ...formResetPassword.fields, email: e.currentTarget.value } }) }}
              type="email"
              disabled={isPending}
            />
            {state?.errors?.email && <p className="text-red-500 text-xs pt-1">{state.errors.email}</p>}
          </div>
          <div className='flex justify-between gap-3'>
            <button
              className="btn-primary w-full text-red-500"
              type='button'
              onClick={() => { onResetPassword(false) }}
              disabled={isPending}
            >
              Cerrar
            </button>
            <button
              className="btn-primary w-full"
              type='submit'
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
