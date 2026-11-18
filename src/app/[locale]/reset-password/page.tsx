import Link from "next/link";
import { FaArrowRightToBracket, FaHouse, FaKey, FaLinkSlash } from "react-icons/fa6";
import { verifyAccessTokenTemp } from "../../utils/auth";
import logger, { jsonLog } from "../../utils/logger";
import { ErrorScreen } from "@/src/app/components/error-screen";
import { FormResetPassword } from "./_components/form-reset-password";

interface IResetPassword {
    searchParams: Promise<{
        code: string
    }>,
}

// Destino del enlace del correo "Recupera tu contraseña": si el token es válido, formulario para elegir
// la contraseña nueva; si caducó, cómo pedir otro.
export default async function Page({ searchParams }: IResetPassword) {
    const { code } = await searchParams;
    const valid = await verifyAccessTokenTemp(code)
    logger.info(`/reset-password data token ${jsonLog(valid)}`);

    if (valid === null) {
        return (
            <ErrorScreen
                icon={FaLinkSlash}
                title="Enlace no válido"
                message='El enlace para restablecer la contraseña caducó o ya se usó. Pide uno nuevo desde "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión.'
            >
                <Link href="/login" className="btn-primary w-full">
                    <FaArrowRightToBracket aria-hidden />
                    Pedir otro enlace
                </Link>
                <Link href="/" className="btn-primary w-full">
                    <FaHouse aria-hidden />
                    Ir al inicio
                </Link>
            </ErrorScreen>
        )
    }

    return (
        <div className="flex flex-1 items-center justify-center px-4 py-10 md:py-20">
            <div className="card w-full max-w-md grid grid-cols-1 gap-4">
                <div className="text-center">
                    <FaKey className="mx-auto text-4xl text-neutral-300" aria-hidden />
                    <h1 className="pt-4 text-xl md:text-2xl font-bold">Crea una nueva contraseña</h1>
                    <p className="pt-2 text-sm text-neutral-400 break-all">
                        Para la cuenta <span className="font-bold text-neutral-200">{valid.email}</span>
                    </p>
                </div>
                <FormResetPassword code={code} />
            </div>
        </div>
    )
}
