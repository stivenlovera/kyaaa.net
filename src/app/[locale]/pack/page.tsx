import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { packInfo } from './_service/code.service';
import logger from '../../utils/logger';

interface PagePaginateProps {
    params: Promise<{
        code: string
    }>
}

export async function generateMetadata({ params }: PagePaginateProps): Promise<Metadata> {
    const { code } = await params;
    const pack = await packInfo(code);
    if (pack === null) {
        return {
            title: (await getTranslations('errores'))('not_found.titulo'),
            robots: { index: false },
        };
    }
    return {
        title: pack.name,
        description: pack.description,
    };
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    logger.warn(`/pack ${code}`)
    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14'>
            INTRODUSCA CODIGO
        </div>
    )
}

