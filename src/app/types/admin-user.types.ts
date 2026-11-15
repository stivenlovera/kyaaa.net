/** Fila de la grilla de /admin/user. Nunca incluye la contraseña. */
export interface IAdminUser {
    user_id: number
    name: string
    nick: string
    email: string
    state: number
    verified_email: Date | null
    is_admin: boolean
    /** Compras registradas (buy_pack): con compras, el usuario no se puede eliminar. */
    total_buys: number
    create_at: Date
}

export interface IAdminUserPage {
    users: IAdminUser[]
    total: number
}

export interface IFormAdminUser {
    user_id?: number
    name: string
    nick: string
    email: string
    /** Obligatoria al crear; al editar, vacía mantiene la actual. */
    password?: string
    state: number
    verified: boolean
    is_admin: boolean
}
