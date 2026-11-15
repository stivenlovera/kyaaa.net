import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDenied, getCurrentAdmin } from "@/src/app/utils/auth";
import { repositoryAdminUser } from "@/src/app/repositories/admin-user.repository";
import { IAdminUser, IFormAdminUser } from "@/src/app/types/admin-user.types";
import { IResponse } from "@/src/app/types/response";
import logger, { jsonLog } from "@/src/app/utils/logger";
import { Prisma } from "../../../../../generated/prisma/client";

// CRUD de usuarios de /admin/user. Las reglas de contraseña y email son las del registro
// (src/app/actions/actionFormRegister.ts). Un admin no puede quitarse su propio rol, desactivarse ni
// eliminarse a sí mismo, para no dejar el panel sin acceso.

const validate = (body: Partial<IFormAdminUser>, isCreate: boolean): string | null => {
    if (!body.name || body.name.trim() === '') {
        return 'El nombre es obligatorio';
    }
    if (!body.nick || body.nick.trim() === '') {
        return 'El nick es obligatorio';
    }
    if (!body.email || !z.email().safeParse(body.email.trim()).success) {
        return 'El email no es válido';
    }
    if (isCreate && !body.password) {
        return 'La contraseña es obligatoria';
    }
    if (body.password && (body.password.length < 5 || body.password.length > 100)) {
        return 'La contraseña debe tener entre 5 y 100 caracteres';
    }
    return null;
}

const toData = (body: IFormAdminUser) => ({
    name: body.name.trim(),
    nick: body.nick.trim(),
    email: body.email.trim(),
    state: body.state ? 1 : 0,
    verified: Boolean(body.verified),
    is_admin: Boolean(body.is_admin),
    password: body.password ? body.password : undefined,
})

const duplicatedEmail = () => NextResponse.json({ success: false, message: 'Ya existe un usuario con ese email' }, { status: 409 });
const notFound = () => NextResponse.json({ success: false, message: 'El usuario ya no existe' }, { status: 404 });

export async function POST(request: NextRequest) {
    logger.info(`api/admin/user POST`)
    try {
        const denied = await adminDenied();
        if (denied) {
            return denied;
        }
        const body: IFormAdminUser = await request.json();
        const error = validate(body, true);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const data = toData(body);
        if (await repositoryAdminUser.findByEmail(data.email) !== null) {
            return duplicatedEmail();
        }
        const user = await repositoryAdminUser.create({ ...data, password: data.password! });
        const resp: IResponse<IAdminUser> = { data: user, message: 'Usuario creado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return duplicatedEmail();
        }
        logger.error(`api/admin/user POST error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    logger.info(`api/admin/user PATCH`)
    try {
        const admin = await getCurrentAdmin();
        const denied = await adminDenied();
        if (denied || admin === null) {
            return denied ?? NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const body: IFormAdminUser = await request.json();
        if (!Number.isInteger(body.user_id)) {
            return NextResponse.json({ success: false, message: 'Falta user_id' }, { status: 400 });
        }
        const error = validate(body, false);
        if (error !== null) {
            return NextResponse.json({ success: false, message: error }, { status: 400 });
        }
        const data = toData(body);
        if (body.user_id === admin.user_id && (!data.is_admin || data.state !== 1)) {
            return NextResponse.json({ success: false, message: 'No puedes quitarte el rol de administrador ni desactivar tu propia cuenta' }, { status: 400 });
        }
        if (await repositoryAdminUser.findByEmail(data.email, body.user_id) !== null) {
            return duplicatedEmail();
        }
        const user = await repositoryAdminUser.update(body.user_id!, data);
        const resp: IResponse<IAdminUser> = { data: user, message: 'Usuario actualizado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2025' || error.code === 'P2001')) {
            return notFound();
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return duplicatedEmail();
        }
        logger.error(`api/admin/user PATCH error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    logger.info(`api/admin/user DELETE`)
    try {
        const admin = await getCurrentAdmin();
        const denied = await adminDenied();
        if (denied || admin === null) {
            return denied ?? NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const body: { user_id?: number } = await request.json();
        if (!Number.isInteger(body.user_id)) {
            return NextResponse.json({ success: false, message: 'Falta user_id' }, { status: 400 });
        }
        if (body.user_id === admin.user_id) {
            return NextResponse.json({ success: false, message: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
        }
        const user = await repositoryAdminUser.findById(body.user_id!);
        if (user === null) {
            return notFound();
        }
        // Las compras son historial de pagos: un usuario con compras se desactiva, no se borra.
        if (user.total_buys > 0) {
            return NextResponse.json({ success: false, message: `No se puede eliminar: tiene ${user.total_buys} compra(s). Desactívalo en su lugar.` }, { status: 409 });
        }
        await repositoryAdminUser.delete(body.user_id!);
        const resp: IResponse<null> = { data: null, message: 'Usuario eliminado', success: true };
        return NextResponse.json(resp, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return notFound();
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            return NextResponse.json({ success: false, message: 'No se puede eliminar: el usuario tiene datos relacionados. Desactívalo en su lugar.' }, { status: 409 });
        }
        logger.error(`api/admin/user DELETE error=> ${jsonLog(error.message)}`)
        return NextResponse.json({ success: false, message: 'Error del servidor' }, { status: 500 });
    }
}
