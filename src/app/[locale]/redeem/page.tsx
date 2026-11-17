import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RedeemForm } from "./_components/redeem-form";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('canjear');
    return { title: t('titulo') };
}

interface RedeemPageProps {
    // `?code=` viene en el enlace que se le envía al comprador: el campo aparece ya relleno.
    searchParams: Promise<{ code?: string }>
}

// Canje de cupones. Es pública a propósito: cualquiera ve el formulario y puede escribir su código;
// la sesión se pide al pulsar "Canjear" (modal de iniciar sesión / crear cuenta que vuelve aquí con
// el código). La API /api/coupon/redeem es la que exige sesión.
export default async function Page({ searchParams }: RedeemPageProps) {
    const { code } = await searchParams;
    return (
        <div className="flex justify-center px-2 py-6 md:py-14">
            <div className="w-full sm:max-w-lg">
                <RedeemForm initialCode={typeof code === 'string' ? code.slice(0, 40) : ''} />
            </div>
        </div>
    );
}
