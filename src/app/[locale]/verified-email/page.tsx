import { getCurrentUser, verifyAccessTokenTemp } from "../../utils/auth";
import logger, { jsonLog } from "../../utils/logger";
import Link from "next/link";
import { repositoryAuth } from "../../repositories/auth.repository";
import { FaArrowRightToBracket, FaCircleCheck, FaHouse, FaLinkSlash, FaUser } from "react-icons/fa6";
import { ErrorScreen } from "@/src/app/components/error-screen";

interface IVerifiedEmail {
    searchParams: Promise<{
        code_verified: string
    }>,
}

const LoginButton = () => (
    <Link href="/login" className="btn-primary w-full">
        <FaArrowRightToBracket aria-hidden />
        Iniciar sesión
    </Link>
)

export default async function Page({ searchParams }: IVerifiedEmail) {
    const { code_verified } = await searchParams;
    const valid = await verifyAccessTokenTemp(code_verified)
    logger.info(`/verified-email data token ${jsonLog(valid)}`);

    const user = await getCurrentUser()

    if (valid === null) {
        return (
            <ErrorScreen
                icon={FaLinkSlash}
                title="Enlace no válido"
                message='El enlace caducó o ya no es válido. Pide uno nuevo desde "Mi cuenta" con el botón "Verificar".'
            >
                {user !== null ? (
                    <Link href="/my-account" className="btn-primary w-full">
                        <FaUser aria-hidden />
                        Ir a Mi cuenta
                    </Link>
                ) : <LoginButton />}
                <Link href="/" className="btn-primary w-full">
                    <FaHouse aria-hidden />
                    Ir al inicio
                </Link>
            </ErrorScreen>
        )
    }

    const verifiedEmail = await repositoryAuth.updateVerifiedEmail(valid!.email)
    logger.info(`/verified-email user data ${jsonLog(verifiedEmail)}`)

    return (
        <ErrorScreen
            icon={FaCircleCheck}
            iconClassName="text-green-500"
            title="Email verificado correctamente"
            message={user !== null
                ? 'Tu email ya está verificado. Ya puedes votar por los próximos packs.'
                : 'Tu email ya está verificado. Inicia sesión para seguir.'}
        >
            {user === null && <LoginButton />}
            <Link href="/" className={`btn-primary w-full ${user !== null ? 'sm:col-span-2' : ''}`}>
                <FaHouse aria-hidden />
                Ir a la página principal
            </Link>
        </ErrorScreen>
    )
}
