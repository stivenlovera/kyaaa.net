import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FaTrophy } from "react-icons/fa6";
import { IParticipateWinner } from "@/src/app/types/participate.types";
import { formatDay } from "@/src/app/utils/other";
import { ParticipateCard } from "./participate-card";

interface LastWinnerProps {
    winner: IParticipateWinner
}

// "Ganador de la semana pasada": el pack más votado de la última votación finalizada. Si ya se publicó,
// enlaza a su ficha; si no, avisa de que llega pronto.
export async function LastWinner({ winner }: LastWinnerProps) {
    const t = await getTranslations('participa');
    const { participate, pack, percent, published } = winner;

    return (
        <section className="card border-yellow-600/60">
            <div className="flex items-center gap-3 pb-3">
                <FaTrophy className="text-3xl text-yellow-400 shrink-0" aria-hidden />
                <div>
                    <h2 className="text-xl md:text-2xl font-bold">{t('ganador_titulo')}</h2>
                    <p className="text-sm text-neutral-400">
                        {t('ganador_votacion', { name: participate.name, start: formatDay(participate.start_date), end: formatDay(participate.start_end) })}
                    </p>
                </div>
            </div>
            <div className="max-w-xl">
                <ParticipateCard pack={pack} highlighted>
                    <div className="flex items-center gap-2">
                        <div
                            className="h-2 flex-1 rounded-full bg-neutral-700 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={t('porcentaje', { percent })}
                        >
                            <div className="h-full rounded-full bg-yellow-400" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-sm font-bold w-10 text-right">{percent}%</span>
                    </div>
                    {published ? (
                        <Link className="btn-primary w-full text-sm font-bold" href={`/pack/${pack.code}`}>
                            {t('ver_pack')}
                        </Link>
                    ) : (
                        <p className="text-sm text-center text-yellow-400 font-bold">{t('muy_pronto')}</p>
                    )}
                </ParticipateCard>
            </div>
        </section>
    );
}
