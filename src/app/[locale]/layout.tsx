import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '../utils/site-metadata';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { GoogleTagManager } from '@next/third-parties/google';
import "../globals.css";
import Header from '../layout/components/navigate/header';
import Footer from '../layout/components/footer/footer';
import { routing } from '@/src/i18n/routing';
import { AuthProvider } from '@/src/providers/AuthProvider';
import AxiosInterceptorProvider from '@/src/providers/AxiosInterceptorProvider';
import { Suspense } from 'react';
import { Splashscreen } from '../layout/components/splashcreen/splashscreen';
import ToastProvider from '@/src/providers/toastProvider';
import AlertProvider from '@/src/providers/alertProvider';
import { getCurrentUser } from '../utils/auth';
import { repositoryAuth } from '../repositories/auth.repository';
import { profileImageUrl } from '../utils/profile-image';
//import logger, { jsonLog } from '../utils/logger';

export interface PageHomeProps {
    params: Promise<{
        locale: string
    }>
}

const inter = Inter({ subsets: ['latin'] });

// Fuente del logo "kyaaa" de la cabecera (utilidad font-wild-words-roman). next/font la precarga y la sirve
// desde /_next/static con caché inmutable. `block` evita que el logo aparezca un instante con la fuente
// del sistema y luego cambie (con `swap` se veía ese salto).
const wildWords = localFont({
    src: '../fonts/new-wild-words.ttf',
    weight: '900',
    style: 'normal',
    display: 'block',
    variable: '--font-wild-words',
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

// Metadatos base de todo el sitio: las páginas que no definen los suyos heredan estos.
export async function generateMetadata({ params }: PageHomeProps): Promise<Metadata> {
    const { locale: requested } = await params;
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
    const t = await getTranslations({ locale, namespace: 'meta' });
    return {
        metadataBase: new URL(SITE_URL),
        title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
        description: t('descripcion'),
        openGraph: {
            type: 'website',
            siteName: SITE_NAME,
            images: [DEFAULT_OG_IMAGE],
        },
        twitter: {
            card: 'summary_large_image',
            images: [DEFAULT_OG_IMAGE],
        },
    };
}

export default async function LocaleLayout({
    children,
    params
}: LayoutProps<'/[locale]'>) {
    // Ensure that the incoming `locale` is valid
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }
    // Enable static rendering
    setRequestLocale(locale);
    const user = await getCurrentUser();
    const isAdmin = user !== null && await repositoryAuth.isAdmin(user.user_id);

    return (
        <html className={`${wildWords.variable} text-white`} lang={locale}>
            <GoogleTagManager gtmId="GTM-5PWHMDJ4" />
            <body className={`${inter.className} bg-neutral-900 min-h-screen flex flex-col`}>
                <Suspense fallback={<Splashscreen></Splashscreen>}>
                    <NextIntlClientProvider>
                        <AuthProvider auth={user === null ? user : {
                            email: user!.email,
                            name: user!.name,
                            nick: user!.nick,
                            image: profileImageUrl(user!.image),
                            is_admin: isAdmin,
                        }}>
                            <AxiosInterceptorProvider>
                                <AlertProvider>
                                    <Header></Header>
                                    <ToastProvider>
                                        <div className='flex-1'>
                                            {children}
                                        </div>
                                        <Footer></Footer>
                                    </ToastProvider>
                                </AlertProvider>
                            </AxiosInterceptorProvider>
                        </AuthProvider>
                    </NextIntlClientProvider>
                </Suspense>
            </body>
        </html >

    );
}