import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { repositoryParticipate } from "../../repositories/participate.repository";
import { IPublicParticipate, VoterStatus } from "../../types/participate.types";
import { getCurrentUser } from "../../utils/auth";
import { formatDay } from "../../utils/other";
import { STATE_PARTICIPATE } from "../../utils/page-access";
import { ParticipateVoting } from "./_components/participate-voting";
import { LastWinner } from "./_components/last-winner";
import { ParticipateHistory } from "./_components/participate-history";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('participa');
    return { title: t('titulo'), description: t('descripcion') };
}

// Votaciones (tabla participate) en curso y finalizadas, cada una con sus packs en "borrador"
// (participate_pack → pack) y sus votos. En las votaciones en curso, un usuario con sesión y correo
// verificado puede votar un pack (un voto por votación). Los borradores no se muestran.
export default async function ParticipatePage() {
    const user = await getCurrentUser();
    const t = await getTranslations('participa');
    const [base, winner] = await Promise.all([
        repositoryParticipate.findPublic(user !== null),
        repositoryParticipate.findLastWinner(user !== null),
    ]);
    const status: VoterStatus = user === null ? 'anonymous' : user.verified_email ? 'verified' : 'unverified';
    const userVotes = user !== null
        ? await repositoryParticipate.findUserVotes(user.user_id, base.map((p) => p.participate_id))
        : new Map<number, number>();

    // Los packs en votación están en borrador (sin publicar): sus tarjetas no llevan me gusta ni favorito.
    const participates: IPublicParticipate[] = base.map((participate) => ({
        ...participate,
        voted: userVotes.get(participate.participate_id) ?? null,
    }));
    // En curso: siempre visibles. Finalizadas: en el historial, oculto hasta pulsar "Ver historial".
    const current = participates.filter((p) => p.state_participate_id === STATE_PARTICIPATE.ACTIVE);
    const finished = participates.filter((p) => p.state_participate_id !== STATE_PARTICIPATE.ACTIVE);

    const renderSection = (participate: IPublicParticipate) => {
        const active = participate.state_participate_id === STATE_PARTICIPATE.ACTIVE;
        return (
            <section key={participate.participate_id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold">{participate.name}</h2>
                        <p className="text-sm text-neutral-400">
                            {t('fechas', { start: formatDay(participate.start_date), end: formatDay(participate.start_end) })}
                        </p>
                    </div>
                    <span className={`self-start sm:self-center text-xs font-bold px-3 py-1 rounded-full ${active ? 'bg-green-700' : 'bg-neutral-700 text-neutral-300'}`}>
                        {active ? t('en_curso') : t('finalizada')}
                    </span>
                </div>
                {participate.packs.length === 0 ? (
                    <p className="text-sm text-neutral-400">{t('sin_packs')}</p>
                ) : (
                    <ParticipateVoting participate={participate} active={active} status={status} />
                )}
            </section>
        );
    };

    return (
        <div className="px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14 grid grid-cols-1 gap-4">
            <div className="card">
                <h1 className="text-center text-2xl md:text-3xl font-bold">{t('titulo')}</h1>
                <p className="text-center text-sm text-neutral-400 pt-1">{t('descripcion')}</p>
            </div>

            {winner !== null && <LastWinner winner={winner} />}

            {current.length === 0 ? (
                <div className="card flex flex-col items-center gap-4 py-10 text-center">
                    <p className="text-neutral-400">{t('vacio')}</p>
                    <Link href="/" className="btn-primary">{t('explorar')}</Link>
                </div>
            ) : current.map(renderSection)}

            {finished.length > 0 && (
                <ParticipateHistory count={finished.length}>
                    {finished.map(renderSection)}
                </ParticipateHistory>
            )}
        </div>
    );
}
