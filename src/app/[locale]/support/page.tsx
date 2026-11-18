import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { isTicketCategory } from "@/src/app/types/ticket.types";
import { SupportForm } from "./_components/support-form";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('soporte');
    return { title: t('titulo') };
}

interface SupportPageProps {
    // Los botones "Reportar un problema" llegan con la categoría y, desde /pack/<code>, el pack.
    searchParams: Promise<{ category?: string, pack?: string }>
}

// Formulario para abrir un ticket. Es pública: sin sesión solo se permite la categoría 'cuenta'
// (quien no puede entrar no puede iniciar sesión); la API /api/ticket aplica la misma regla.
export default async function Page({ searchParams }: SupportPageProps) {
    const { category, pack: packCode } = await searchParams;
    const code = typeof packCode === 'string' ? packCode.slice(0, 64) : '';
    const meta = code ? await repositoryPack.findPackMeta(code) : null;

    return (
        <div className="flex justify-center px-2 py-6 md:py-14">
            <div className="w-full sm:max-w-xl">
                <SupportForm
                    initialCategory={isTicketCategory(category) ? category : undefined}
                    pack={meta !== null ? { code, name: meta.name } : null}
                />
            </div>
        </div>
    );
}
