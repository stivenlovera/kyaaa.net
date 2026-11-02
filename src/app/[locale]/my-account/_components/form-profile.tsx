'use client'
import Form from "next/form";
import { ChangeEvent, useActionState, useEffect, useRef, useState } from "react";
import { IFormChangeProfile, IIsVerifiedEmail, initialStateFormChangeProfile, IUserIAuthentication, } from "../../../types/user.type";
import { DialogChangeEmail } from "./dialog-change-email";
import { DialogChangePassword } from "./dialog-change-password";
import { actionFormChangeProfile } from "@/src/app/actions/actionFormChangeProfile";
import { useAuth } from "@/src/providers/AuthContext";
import { useToast } from "@/src/providers/toastProvider";
import { useAlert } from "@/src/providers/alertProvider";
import { DialogChangeVerifiedEmail } from "./dialog-change-verified-email";
import API from "@/src/providers/api";
import { IResponse } from "@/src/app/types/response";
import moment from "moment";

export const FormProfile = () => {

    const [formUser, setFomrUser] = useState<IFormChangeProfile>(initialStateFormChangeProfile)
    const [openChangeVerifiedEmail, setChangeVerifiedEmail] = useState<boolean>(false)
    const [openChangeEmail, setChangeEmail] = useState<boolean>(false)
    const [openChangePassword, setChangePassword] = useState<boolean>(false)

    const { checkAuth } = useAuth()
    const { showToast } = useToast()
    const { setAlert } = useAlert()
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFomrUser({ ...formUser, fields: { ...formUser.fields, image: url } })
        }
    };

    const fetchFormUser = async () => {
        try {
            const { data, status } = await API.get<IResponse<IUserIAuthentication>>('/api/user/auth')
            if (status === 200) {
                setFomrUser({
                    ...initialStateFormChangeProfile, fields: {
                        email: data.data.user.email,
                        name: data.data.user.name,
                        nick: data.data.user.nick,
                        image: data.data.user.image!,
                        file: null,
                        verified_email: data.data.user.verified_email
                    }
                })
                console.log(moment(data.data.user.verified_email).format('DD/MM/YYYY HH:mm:ss'))
            }
        } catch (error) {
            console.log(error)
        }
        finally { }
    }

    const action = async (prevState: IFormChangeProfile, formData: FormData) => {
        const result = await actionFormChangeProfile(prevState, formData)
        if (result.success) {
            showToast("Cambios guardados correctamente")
            checkAuth()
            await fetchFormUser()
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(action, formUser);

    const getVerfiedEmail = async () => {
        try {
            const { data, status } = await API.get<IResponse<IIsVerifiedEmail>>('/api/user/verified-email')
            if (status === 200) {
                if (data.data.verified === false) {
                    setChangeVerifiedEmail(true)
                } else {
                    setAlert({
                        message: data.data.message,
                        open: true,
                        icon: "success"
                    })
                }
            }
        } catch (error) {
            console.log(error)
        }
        finally {

        }
    }

    useEffect(() => {
        fetchFormUser()
    }, [])

    return (
        <div className="card">
            <div className="p-3 pt-0" >
                <p className="text-center text-2xl pb-2">Mi cuenta</p>
                <Form action={formAction}>
                    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col gap-4">
                                <label
                                    htmlFor="name"
                                    className="block text-xs font-medium mb-1">
                                    Imagen de perfil
                                </label>
                                <div className="items-center justify-center flex">
                                    {/* <div className="relative bg-[url('https://usc1.contabostorage.com/698352ccd113428cb40866703a92c514:kyaaa.net/20260128202951/tumb/029.avif')] bg-cover bg-center h-64 w-full">

                                                <div className="absolute inset-0 bg-black/30"></div>

                                                <div className="relative z-10 flex items-end justify-center h-full">
                                                    <h1 className="text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] hover:text-blue-800 text-3xl font-bold cursor-pointer">Subir imagen</h1>
                                                </div>
                                            </div> */}
                                    <img
                                        src={formUser.fields.image!}
                                        alt="Perfil"
                                        className="w-50 h-50 rounded-full object-cover"
                                    ></img>
                                </div>
                                {isPending.toString()}
                                <div className="flex flex-row gap-4">
                                    <button
                                        id="dropdown-button"
                                        className="btn-primary w-full"
                                        onClick={() => fileInputRef.current?.click()}
                                        type="button"
                                        disabled={isPending}
                                    >
                                        Subir foto
                                    </button>
                                    <input
                                        type="file"
                                        name="file"
                                        hidden
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label
                                    htmlFor="nick"
                                    className="block text-xs font-medium mb-1">
                                    Apodo
                                </label>
                                <input
                                    id="nick"
                                    className="w-full"
                                    placeholder='Apodo'
                                    name="nick"
                                    defaultValue={formUser.fields.nick}
                                    onKeyUp={(e) => { setFomrUser({ ...formUser, fields: { ...formUser.fields, nick: e.currentTarget.value } }) }}
                                    type="text"
                                    disabled={isPending}
                                />
                                {state?.errors?.nick && <p className="text-red-500 text-xs pt-1">{state.errors.nick}</p>}
                            </div>
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-xs font-medium mb-1">
                                    Nombre completo
                                </label>
                                <input
                                    id="name"
                                    className="w-full"
                                    placeholder='Nombre completo'
                                    name="name"
                                    defaultValue={formUser.fields.name}
                                    onKeyUp={(e) => { setFomrUser({ ...formUser, fields: { ...formUser.fields, name: e.currentTarget.value } }) }}
                                    type="text"
                                    disabled={isPending}
                                />
                                {state?.errors?.name && <p className="text-red-500 text-xs pt-1">{state.errors.name}</p>}
                            </div>
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-medium mb-1">
                                    Email
                                </label>
                                <div className="">
                                    <p className="p-1"> {formUser.fields.email}</p>
                                </div>
                            </div>
                            <div>
                                {
                                    formUser.fields.verified_email === null ? (
                                        <button
                                            className="btn-primary w-full"
                                            onClick={getVerfiedEmail}
                                            type='button'
                                            disabled={isPending}
                                        >
                                            Verificar
                                        </button>
                                    ) : (<button
                                        className="btn-primary w-full"
                                        type='button'
                                        disabled
                                    >
                                        Verificado correctamente
                                    </button>)
                                }
                            </div>
                            <div>
                                <button
                                    className="btn-primary w-full"
                                    onClick={() => { setChangeEmail(true) }}
                                    type='button'
                                    disabled={isPending}
                                >
                                    Modificar email
                                </button>
                            </div>
                            <div>
                                <button
                                    className="btn-primary w-full"
                                    onClick={() => { setChangePassword(true) }}
                                    type='button'
                                    disabled={isPending}
                                >
                                    Modificar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 text-center justify-center">
                        <button
                            className="btn-primary w-full"
                            type="submit"
                            disabled={isPending}
                        >
                            Guardar
                        </button>
                    </div>
                </Form>
            </div>

            <DialogChangeVerifiedEmail
                openChangeEmail={openChangeVerifiedEmail}
                onChangeEmail={(open) => {
                    setChangeVerifiedEmail(open)
                    fetchFormUser()
                }}
            >
            </DialogChangeVerifiedEmail>

            <DialogChangeEmail
                openChangeEmail={openChangeEmail}
                onChangeEmail={(open)=>{
                    setChangeEmail(open)
                    fetchFormUser()
                }}
            ></DialogChangeEmail>

            <DialogChangePassword
                openChangePassword={openChangePassword}
                onChangePassword={setChangePassword}
            ></DialogChangePassword>

        </div>)
}