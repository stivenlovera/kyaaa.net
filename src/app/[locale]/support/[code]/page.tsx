import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/src/app/utils/auth";
import { repositoryTicket } from "@/src/app/repositories/ticket.repository";
import { canAccessTicket } from "@/src/app/utils/ticket-access";
import { formatTicketCode, normalizeTicketCode } from "@/src/app/utils/ticket-code";
import { TicketThread } from "@/src/app/components/ticket-thread";
import { LocalDate } from "@/src/app/components/local-date";
import { TicketReplyForm } from "./_components/ticket-reply-form";
import { TicketStatusBadge } from "../_components/ticket-status-badge";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
    const { code } = await params;
    const t = await getTranslations('soporte.ticket');
    return { title: t('titulo', { code: formatTicketCode(code.toUpperCase()) }), robots: { index: false } };
}

interface TicketPageProps {
    params: Promise<{ code: string }>
    // `t` es el access_token del enlace del correo: abre el ticket sin sesión.
    searchParams: Promise<{ t?: string }>
}

// Detalle de un ticket para quien lo abrió: su dueño con sesión o cualquiera con el enlace del correo.
// Si no existe o no hay acceso se muestra lo mismo, para no revelar qué códigos existen.
export default async function Page({ params, searchParams }: TicketPageProps) {
    const { code: rawCode } = await params;
    const { t: token } = await searchParams;
    const t = await getTranslations('soporte');
    const user = await getCurrentUser();
    const code = normalizeTicketCode(rawCode);
    const ticket = code !== null ? await repositoryTicket.findDetail(code) : null;

    if (ticket === null || !canAccessTicket(ticket, user?.user_id ?? null, typeof token === 'string' ? token : null)) {
        return (
            <div className="flex justify-center px-2 py-6 md:py-14">
                <div className="card w-full sm:max-w-md text-center">
                    <h1 className="text-xl font-bold pb-2">{t('ticket.no_encontrado')}</h1>
                    <p className="text-sm text-neutral-400 pb-4">{t('ticket.no_encontrado_desc')}</p>
                    <Link href="/support" className="btn-primary w-full">{t('ticket.nuevo')}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center px-2 py-6 md:py-14">
            <div className="card w-full sm:max-w-2xl grid grid-cols-1 gap-4">
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h1 className="text-xl font-bold">{t('ticket.titulo', { code: formatTicketCode(ticket.code) })}</h1>
                        <TicketStatusBadge status={ticket.status} label={t(`estado.${ticket.status}`)} />
                    </div>
                    <p className="text-sm font-bold pt-2 break-words">{ticket.subject}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-neutral-400">
                        <span>{t(`categoria.${ticket.category}`)}</span>
                        {ticket.pack !== null && (
                            <Link href={`/pack/${ticket.pack.code}`} className="underline hover:text-white">{ticket.pack.name}</Link>
                        )}
                        <span>{t('ticket.creado')} <LocalDate date={ticket.create_at} /></span>
                    </div>
                </div>

                <TicketThread messages={ticket.messages} staffLabel={t('ticket.soporte')} userLabel={t('ticket.tu')} />

                {ticket.status === 'cerrado' ? (
                    <div className="grid grid-cols-1 gap-3">
                        <p className="text-sm text-neutral-400">{t('ticket.cerrado_aviso')}</p>
                        <Link href="/support" className="btn-primary w-full">{t('ticket.nuevo')}</Link>
                    </div>
                ) : (
                    <>
                        {ticket.status === 'resuelto' && <p className="text-sm text-neutral-400">{t('ticket.resuelto_aviso')}</p>}
                        <TicketReplyForm code={ticket.code} token={typeof token === 'string' ? token : undefined} />
                    </>
                )}
            </div>
        </div>
    );
}
