import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { getCurrentUser } from "@/src/app/utils/auth";
import { notFound, redirect } from "next/navigation";
import { PayPack } from "./components/pay-pack";
import { repositoryPage } from "@/src/app/repositories/pages.repository";
import { repositoryBuyPack } from "@/src/app/repositories/buy-pack.repository";
import { routing } from "@/src/i18n/routing";

export const dynamic = "force-dynamic";
interface PageProps {
    params: Promise<{
        code: string
        locale: string
    }>,
    searchParams: Promise<{
        page: string
    }>
}
export default async function Page({ params }: PageProps) {
    const { code, locale } = await params;

    const user = await getCurrentUser();
    const pack = await repositoryPack.findPackInfo(code, user !== null);

    if (user === null) {
        notFound()
    }

    if (pack === null) {
        notFound()
    }

    // Si ya lo compró, o es gratis para registrados (no tiene páginas de pago), no se le deja pagar:
    // va directo al pack, que ya ve entero.
    if (await repositoryBuyPack.verfiedLikeForUser(user.user_id, pack.pack_id) !== null
        || await repositoryPage.isFreeForRegistered(pack.pack_id)) {
        const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
        redirect(`${prefix}/pack/${pack.code}`);
    }

    const totalImages = await repositoryPage.countByPack(pack.pack_id);

    return (
        <PayPack pack={pack} totalImages={totalImages}></PayPack>
    )
}
