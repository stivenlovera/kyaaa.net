import { getCurrentUser, verifyAccessTokenTemp } from "../../utils/auth";
import logger, { jsonLog } from "../../utils/logger";
import Link from "next/link";
import { repositoryAuth } from "../../repositories/auth.repository";
import { FaArrowRightToBracket, FaHouse, FaUser } from "react-icons/fa6";

interface IVerifiedEmail {
    searchParams: Promise<{
        code_verified: string
    }>,
}

const Container = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-center h-dvs md:h-screen">
        <div className="p-4 w-full sm:w-md">
            <div className="card text-center">
                {children}
            </div>
        </div>
    </div>
)

export default async function Page({ searchParams }: IVerifiedEmail) {
    const { code_verified } = await searchParams;
    const valid = await verifyAccessTokenTemp(code_verified)
    logger.info(`/verified-email data token ${jsonLog(valid)}`);

    const user = await getCurrentUser()

    if (valid === null) {
        return (
            <Container>
                <h1 className="text-xl font-bold pb-2">Enlace no válido</h1>
                <p className="text-sm text-neutral-400 pb-4">
                    El enlace caducó o ya no es válido. Pide uno nuevo desde &quot;Mi cuenta&quot; con el botón &quot;Verificar&quot;.
                </p>
                {user !== null ? (
                    <Link href="/my-account" className="btn-primary w-full">
                        <FaUser aria-hidden />
                        Ir a Mi cuenta
                    </Link>
                ) : (
                    <Link href="/login" className="btn-primary w-full">
                        <FaArrowRightToBracket aria-hidden />
                        Iniciar sesión
                    </Link>
                )}
            </Container>
        )
    }

    const verifiedEmail = await repositoryAuth.updateVerifiedEmail(valid!.email)
    logger.info(`/verified-email user data ${jsonLog(verifiedEmail)}`)

    return (
        <Container>
            <h1 className="text-xl font-bold pb-2">Email verificado correctamente</h1>
            <p className="text-sm text-neutral-400 pb-4">
                {user !== null
                    ? 'Tu email ya está verificado. Ya puedes votar por los próximos packs.'
                    : 'Tu email ya está verificado. Inicia sesión para seguir.'}
            </p>
            {user !== null ? (
                <Link href="/" className="btn-primary w-full">
                    <FaHouse aria-hidden />
                    Ir a la página principal
                </Link>
            ) : (
                <Link href="/login" className="btn-primary w-full">
                    <FaArrowRightToBracket aria-hidden />
                    Iniciar sesión
                </Link>
            )}
        </Container>
    )
}
