import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { FaChevronRight, FaHeadset } from "react-icons/fa6";
import { routing } from "@/src/i18n/routing";
import { loginHref } from "@/src/app/utils/login-redirect";
import { getCurrentUser } from "@/src/app/utils/auth";
import { repositoryTicket } from "@/src/app/repositories/ticket.repository";
import { formatTicketCode } from "@/src/app/utils/ticket-code";
import { LocalDate } from "@/src/app/components/local-date";
import { PageHomeProps } from "../layout";
import { TicketStatusBadge } from "../support/_components/ticket-status-badge";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('soporte.lista');
    return { title: t('titulo') };
}

// Tickets del usuario. El proxy ya exige sesión; esto es la segunda barrera.
export default async function Page({ params }: PageHomeProps) {
    const { locale } = await params;
    const user = await getCurrentUser();
    if (user === null) {
        const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
        redirect(loginHref(`${prefix}/my-tickets`, { loginPath: `${prefix}/login` }));
    }
    const t = await getTranslations('soporte');
    const tickets = await repositoryTicket.findByUser(user.user_id);

    return (
        <div className="flex justify-center px-2 py-6 md:py-14">
            <div className="card w-full sm:max-w-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                    <h1 className="text-2xl font-bold">{t('lista.titulo')}</h1>
                    <Link href="/support" className="btn-primary">
                        <FaHeadset aria-hidden />
                        {t('lista.nuevo')}
                    </Link>
                </div>
                {tickets.length === 0 ? (
                    <p className="py-10 text-center text-sm text-neutral-400">{t('lista.vacio')}</p>
                ) : (
                    <ul className="divide-y divide-neutral-700">
                        {tickets.map((ticket) => (
                            <li key={ticket.ticket_id}>
                                <Link href={`/support/${ticket.code}`} className="flex items-center gap-3 py-3 px-1 hover:bg-neutral-800 rounded-md">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-xs text-neutral-400">{formatTicketCode(ticket.code)}</span>
                                            <TicketStatusBadge status={ticket.status} label={t(`estado.${ticket.status}`)} />
                                        </div>
                                        <p className="text-sm font-bold truncate pt-1">{ticket.subject}</p>
                                        <p className="text-xs text-neutral-400">
                                            {t(`categoria.${ticket.category}`)} · {t('lista.actualizado')} <LocalDate date={ticket.update_at} withTime={false} />
                                        </p>
                                    </div>
                                    <FaChevronRight className="shrink-0 text-neutral-500" aria-hidden />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
