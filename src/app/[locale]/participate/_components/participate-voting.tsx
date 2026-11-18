'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FaCheck, FaCheckToSlot } from 'react-icons/fa6'
import { IPublicParticipate, IVoteResult, VoterStatus } from '@/src/app/types/participate.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'
import { useToast } from '@/src/providers/toastProvider'
import { ParticipateCard } from './participate-card'
import { DialogLoginToVote } from './dialog-login-to-vote'

/**
 * Porcentaje de votos de cada pack sobre el total de la votación, en enteros que suman 100 (método del
 * mayor resto: se reparten los puntos que faltan a los packs con más decimales). Sin votos, todos 0.
 */
const toPercents = (ids: number[], votes: Record<number, number>): Record<number, number> => {
    const total = ids.reduce((sum, id) => sum + (votes[id] ?? 0), 0)
    if (total === 0) {
        return Object.fromEntries(ids.map((id) => [id, 0]))
    }
    const exact = ids.map((id) => ({ id, value: ((votes[id] ?? 0) * 100) / total }))
    const result = Object.fromEntries(exact.map(({ id, value }) => [id, Math.floor(value)]))
    let missing = 100 - Object.values(result).reduce((sum, v) => sum + v, 0)
    for (const { id } of [...exact].sort((a, b) => (b.value % 1) - (a.value % 1))) {
        if (missing <= 0) break
        result[id] += 1
        missing -= 1
    }
    return result
}

interface ParticipateVotingProps {
    participate: IPublicParticipate
    /** true si la votación está en curso (solo entonces se puede votar). */
    active: boolean
    status: VoterStatus
}

// Packs de una votación con sus votos y el botón para votar. Un voto por usuario y votación: votar otro
// pack mueve el voto y volver a pulsar el votado lo quita (lo decide la API). En una votación en curso el
// botón se ve siempre; sin sesión o sin correo verificado abre un modal que explica qué hacer.
export const ParticipateVoting = ({ participate, active, status }: ParticipateVotingProps) => {
    const t = useTranslations('participa')
    // El resultado de votar se avisa con un toast (no bloquea la página como el modal de alerta).
    const { showToast } = useToast()
    const [voted, setVoted] = useState<number | null>(participate.voted)
    const [votes, setVotes] = useState<Record<number, number>>(
        () => Object.fromEntries(participate.packs.map((p) => [p.participate_pack_id, p.votes]))
    )
    const [pending, setPending] = useState<number | null>(null)
    const [askLogin, setAskLogin] = useState(false)

    const vote = async (participate_pack_id: number) => {
        setPending(participate_pack_id)
        try {
            const { data } = await API.post<IResponse<IVoteResult>>('/api/participate/vote', { participate_pack_id })
            if (data.success) {
                setVoted(data.data.voted)
                setVotes(data.data.votes)
                showToast(data.data.voted === null ? t('voto_quitado') : t('voto_registrado'), 'success')
            }
        } catch (err: any) {
            showToast(err?.response?.data?.message || t('error_voto'), 'danger')
        } finally {
            setPending(null)
        }
    }

    const percents = toPercents(participate.packs.map((p) => p.participate_pack_id), votes)

    // Dentro de cada tarjeta: el porcentaje de votos y, si la votación está en curso, el botón.
    const voteArea = (participate_pack_id: number) => {
        const percent = percents[participate_pack_id] ?? 0
        const isVoted = voted === participate_pack_id
        return (
            <>
                <div className='flex items-center gap-2'>
                    <div
                        className='h-2 flex-1 rounded-full bg-neutral-700 overflow-hidden'
                        role='progressbar'
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t('porcentaje', { percent })}
                    >
                        <div className={`h-full rounded-full ${isVoted ? 'bg-green-400' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
                    </div>
                    <span className='text-sm font-bold w-10 text-right'>{percent}%</span>
                </div>
                {active && (
                    <button
                        className={`btn-primary w-full flex ${isVoted ? 'text-green-400' : ''}`}
                        type='button'
                        onClick={() => {
                            if (status === 'verified') {
                                vote(participate_pack_id)
                            } else {
                                setAskLogin(true)
                            }
                        }}
                        disabled={pending !== null}
                        title={isVoted ? t('quitar_voto') : undefined}
                    >
                        {isVoted ? <><FaCheck /> {t('tu_voto')}</> : <><FaCheckToSlot /> {t('votar')}</>}
                    </button>
                )}
            </>
        )
    }

    return (
        <div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3'>
                {participate.packs.map((pack) => (
                    <ParticipateCard key={pack.participate_pack_id} pack={pack} highlighted={voted === pack.participate_pack_id}>
                        {voteArea(pack.participate_pack_id)}
                    </ParticipateCard>
                ))}
            </div>
            {status !== 'verified' && (
                <DialogLoginToVote open={askLogin} onClose={() => { setAskLogin(false) }} reason={status} />
            )}
        </div>
    )
}
