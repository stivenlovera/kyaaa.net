import { TabAuth } from "./_components/tab-auth";
import { LOGIN_NEXT_PARAM, LOGIN_TAB_PARAM, LOGIN_TAB_REGISTER, safeNextPath } from "@/src/app/utils/login-redirect";

interface LoginPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

// `?next=<ruta>`: página a la que volver tras iniciar sesión o registrarse (por defecto '/').
// `?tab=register`: abre directamente la pestaña de registro.
export default async function Page({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
    const next = safeNextPath(first(params[LOGIN_NEXT_PARAM]));
    const register = first(params[LOGIN_TAB_PARAM]) === LOGIN_TAB_REGISTER;

    return (
        <div className="w-screen h-screen flex items-center justify-center -mt-27">
            <div className="login-form pt-40 pb-2 px-2">
                {/* key: si cambia la query (p. ej. otro enlace a /login), la pestaña se reinicia. */}
                <TabAuth key={`${next}|${register}`} next={next} register={register}></TabAuth>
            </div>
        </div>
    )
}
