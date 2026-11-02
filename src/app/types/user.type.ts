import { profileImageUrl } from "../utils/profile-image";
export interface JWTPayload {
    user_id: number;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'moderator';
}

export interface IAuth {
    email: string
    name: string
    nick: string
    image: string | null
    file?: string | null
    /** Solo para la UI (mostrar el enlace al admin). Los permisos reales se comprueban en el servidor. */
    is_admin?: boolean
}

export interface IAuthentication extends IAuth {
    verified_email?: Date | null
}

export interface IUserIAuthentication {
    user: IAuthentication
    secretInfo: string,
    timestamp: string
}

export interface IUserAuth {
    user: IAuth
    secretInfo: string,
    timestamp: string
}

export interface IUser {
    user_id: number
    email: string
    name: string
    nick: string
    image?: string | null
    state?: number
    verified_email?: Date | null
    password: string
    create_at?: Date
    update_at?: Date
}

export interface IErrorsFormRegister {
    name?: string | null
    email?: string | null
    password?: string | null
    confirm_password?: string | null
    term_use?: string | null
}

export interface IFieldsFormRegister {
    name?: string
    email?: string
    password?: string
    confirm_password?: string
    term_use?: boolean
}

export interface IFormRegister {
    errors?: IErrorsFormRegister
    success: boolean
    fields: IFieldsFormRegister
}

export const initialStateFormRegister: IFormRegister = {
    errors: {},
    success: false,
    fields: {
        name: 'ali stiven lovera huarachi',
        email: 'stivenlovera@gmail.com',
        password: '12345',
        confirm_password: '12345',
        term_use: true,
    }
}

export interface IErrorsFormLogin {
    email?: string | null
    password?: string | null
}

export interface IFieldsFormLogin {
    email?: string
    password?: string
}

export interface IFormLogin {
    errors?: IErrorsFormLogin
    success: boolean
    fields: IFieldsFormLogin
}

export const initialStateFormLogin: IFormLogin = {
    errors: {},
    success: false,
    fields: {
        email: "stivenlovera@gmail.com",
        password: "12345"
    },
}

export interface IFormChangeProfile {
    errors?: IErrorsChangeProfile
    success: boolean
    fields: IFieldsChangeProfile
}

export interface IErrorsChangeProfile {
    email?: string | null
    name?: string | null
    nick?: string | null
    image?: string | null
    file?: string | null
}

export interface IFieldsChangeProfile {
    email?: string
    name?: string
    nick?: string
    image?: string
    file?: File | null
    verified_email?: Date | null
}

export const initialStateFormChangeProfile: IFormChangeProfile = {
    errors: {},
    success: false,
    fields: {
        email: "",
        name: "",
        nick: "",
        image: profileImageUrl(null),
        file: null,
        verified_email: null
    },
}

export interface IIsVerifiedEmail {
    verified: boolean
    message: string
}

export interface IErrorsFormUpdateEmail {
    email?: string | null
    new_email?: string | null
}

export interface IFieldsFormUpdateEmail {
    email?: string
    new_email?: string
}

export interface IFormUpdateEmail {
    errors?: IErrorsFormUpdateEmail
    success: boolean
    fields: IFieldsFormUpdateEmail
}

export const initialStateFieldsFormUpdateEmail: IFormUpdateEmail = {
    success: false,
    fields: {
        email: "",
        new_email: ""
    },
    errors: {}
}

export interface IErrorsFormUpdatePassword {
    current_password?: string | null
    new_password?: string | null
    confirm_password?: string | null
}

export interface IFieldsFormUpdatePassword {
    current_password?: string
    new_password?: string 
    confirm_password?: string
}

export interface IFormUpdatePassword {
    errors?: IErrorsFormUpdatePassword
    success: boolean
    fields: IFieldsFormUpdatePassword
}

export const initialStateFieldsFormUpdatePassword: IFormUpdatePassword = {
    success: false,
    fields: {
        current_password: "",
        new_password: "",
        confirm_password: ""
    },
    errors: {}
}


export interface IErrorsFormResetPassword {
    email?: string | null
}

export interface IFieldsFormResetPassword {
    email?: string
}

export interface IFormResetPassword {
    errors?: IErrorsFormResetPassword
    success: boolean
    fields: IFieldsFormResetPassword
}

export const initialStateFieldsFormResetPassword: IFormResetPassword = {
    success: false,
    fields: {
        email: ""
    },
    errors: {}
}


export interface IErrorsFormNewPassword {
    code?: string | null
    new_password?: string | null
    confirm_password?: string | null
}

export interface IFieldsFormNewPassword {
    code?: string
    new_password?: string 
    confirm_password?: string
}

export interface IFormNewPassword {
    errors?: IErrorsFormNewPassword
    success: boolean
    fields: IFieldsFormNewPassword
}

export const initialStateFieldsFormNewPassword: IFormNewPassword = {
    success: false,
    fields: {
        code: "",
        new_password: "",
        confirm_password: ""
    },
    errors: {}
}