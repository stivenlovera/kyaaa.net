"use client"
import { safeNextPath } from "@/src/app/utils/login-redirect";
import { useAuth } from "@/src/providers/AuthContext";
import { useRouter } from "@/src/app/layout/components/navigate/use-loading-router";
import { useActionState, useState } from "react";
import Form from "next/form";
import { IFormLogin, initialStateFormLogin } from "@/src/app/types/user.type";
import { DialogResetPassword } from "./dialog-reset-password";
import { actionFormLogin } from "@/src/app/actions/actionFormLogin";

export const FormLogin = ({ next }: { next?: string }) => {

    const router = useRouter();
    const { checkAuth } = useAuth()
    const [openDialogResetPassword, setDialogResetPassword] = useState<boolean>(false)

    const action = async (prevState: IFormLogin, formData: FormData) => {
        const result = await actionFormLogin(prevState, formData)
        if (result.success) {
            checkAuth()
            router.push(safeNextPath(next))
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(action, initialStateFormLogin);

    return (
        <div>
            <Form
                className='p-2'
                action={formAction}
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-medium mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            className="w-full"
                            type="email"
                            name="email"
                            autoComplete="off"
                            defaultValue={state?.fields?.email}
                        />
                        {state?.errors?.email && <p className="text-red-500 text-xs pt-1">{state.errors.email}</p>}
                    </div>
                    <div>
                        <label
                            htmlFor="contraseña"
                            className="block text-xs font-medium mb-1">
                            Contraseña
                        </label>
                        <input
                            id="contraseña"
                            className="w-full"
                            placeholder="Contraseña"
                            type="password"
                            name="password"
                            autoComplete="off"
                            defaultValue={state?.fields?.password}
                        />
                        {state?.errors?.password && <p className="text-red-500 text-xs pt-1">{state.errors.password}</p>}
                    </div>
                    <div className="text-sm">
                        ¿Olvidaste tu contraseña?, haz click <b
                            className="underline text-blue-600 cursor-pointer"
                            onClick={() => { setDialogResetPassword(true) }}
                        >AQUI</b>.
                    </div>
                </div>
                <div className='text-center pt-4'>
                    <button
                        className='btn-primary w-full'
                        type="submit"
                        disabled={isPending}
                    >
                        <div className='flex flex-row'>
                            <p className='px-2'>{isPending ? '...' : 'Inicia sesion'}</p>
                        </div>
                    </button>
                </div>
            </Form>
            <DialogResetPassword
                onResetPassword={(open) => { setDialogResetPassword(open) }}
                openResetPassword={openDialogResetPassword}
            ></DialogResetPassword>
        </div>
    )
}
