import { Metadata } from "next";
import Link from "next/link";
import { FaFlag } from "react-icons/fa6";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { routing } from "@/src/i18n/routing";
import { loginHref } from "@/src/app/utils/login-redirect";
import { repositoryPack } from "../../repositories/pack.repository";
import { getCurrentUser } from "../../utils/auth";
import { withUserFlags } from "../../utils/user-packs";
import { PackGrid } from "../_components/pack-grid";
import { PageHomeProps } from "../layout";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('mis_compras');
    return { title: t('titulo') };
}

// Packs que el usuario compró. El proxy ya exige sesión; esto es la segunda barrera.
export default async function Page({ params }: PageHomeProps) {
    const { locale } = await params;
    const user = await getCurrentUser();
    if (user === null) {
        const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
        redirect(loginHref(`${prefix}/my-purchases`, { loginPath: `${prefix}/login` }));
    }
    const t = await getTranslations('mis_compras');
    const tSupport = await getTranslations('soporte');
    const packs = await withUserFlags(await repositoryPack.findPacksBought(user.user_id), user.user_id);

    return (
        <PackGrid
            title={t('titulo')}
            packs={packs}
            empty={{ message: t('vacio'), linkText: t('explorar'), href: '/' }}
            footer={(
                <div className="flex justify-center pt-4 text-sm">
                    <Link href="/support?category=pago" className="inline-flex items-center gap-1 text-neutral-400 hover:text-white hover:underline">
                        <FaFlag aria-hidden />
                        {tSupport('reportar_compra')}
                    </Link>
                </div>
            )}
        />
    );
}
