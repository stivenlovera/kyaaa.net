import { repositoryPack } from '@/src/app/repositories/pack.repository';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import logger, { jsonLog } from '@/src/app/utils/logger';
import { ViewPage } from './_components/preview-page';
import { repositoryPage } from '@/src/app/repositories/pages.repository';
import { PreviewPack } from './_components/preview-pack';
import { isNumber } from '@/src/app/utils/other';
import { getCurrentUser } from '@/src/app/utils/auth';

export const dynamic = "force-dynamic";

interface PagePaginateProps {
    params: Promise<{
        locale: string
        code: string
    }>,
    searchParams: Promise<{
        page: string
        p?: string
    }>
}

export async function generateMetadata({ params }: PagePaginateProps): Promise<Metadata> {
    const { locale, code } = await params;

    const pack = await repositoryPack.findPackMeta(code);
    if (pack === null) {
        return {
            title: "Pagina no encontra",
            description: "No hay informacion",
        };
    }
    // Todas las páginas del visor (?page=N) comparten la ficha del pack como URL canónica.
    const url = `/${locale}/pack/${code}`;
    const images = pack.image ? [{ url: pack.image, width: 1200, height: 630, alt: pack.name }] : undefined;
    return {
        metadataBase: new URL(process.env.SITE_URL ?? 'https://kyaaa.net'),
        title: pack.name,
        description: pack.description,
        alternates: { canonical: url },
        openGraph: {
            type: 'website',
            siteName: 'kyaaa',
            title: pack.name,
            description: pack.description,
            url: url,
            images: images,
        },
        twitter: {
            card: pack.image ? 'summary_large_image' : 'summary',
            title: pack.name,
            description: pack.description,
            images: images,
        },
    };
}

export default async function Page({ params, searchParams }: PagePaginateProps) {
    const { code } = await params;
    const { page, p } = await searchParams;
    logger.info(`/pack ${jsonLog(page)}`)

    if (page !== undefined) {
        const user = await getCurrentUser();
        // Solo trae las páginas que este usuario puede ver: las gratis, o todas si el pack es gratuito o lo compró.
        const pack = await repositoryPage.findPagesPack(code, 3, user?.user_id);
        if (pack === null || !isNumber(page) || !pack.pages.some((p) => p.num === page)) {
            redirect('/pack/' + code)
        }
        return (
            <ViewPage
                pack={pack}
                code={code}
                currentPage={page}
            >
            </ViewPage>
        )
    } else {
        return (
            <PreviewPack
                code={code}
                currentPage={p !== undefined && isNumber(p) ? Math.trunc(Number(p)) : 1}
            >
            </PreviewPack>
        )
    }
}

