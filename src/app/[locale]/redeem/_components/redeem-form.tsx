'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { isAxiosError } from 'axios'
import { FaTicket } from 'react-icons/fa6'
import Link from 'next/link'
import { RedeemResult } from '@/src/app/types/coupon.types'
import { IResponse } from '@/src/app/types/response'
import API from '@/src/providers/api'
import { useAuth } from '@/src/providers/AuthContext'
import { DialogLoginToRedeem } from './dialog-login-to-redeem'

type ErrorKey = Extract<RedeemResult, { ok: false }>['error'] | 'demasiados_intentos' | 'servidor'

export const RedeemForm = ({ initialCode }: { initialCode: string }) => {
    const t = useTranslations('canjear')
    const [code, setCode] = useState(initialCode)
    const [error, setError] = useState<ErrorKey | null>(null)
    const [redeemed, setRedeemed] = useState<{ code: string, name: string } | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [openLogin, setOpenLogin] = useState(false)
    const { user } = useAuth()

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)
        // Sin sesión: se guarda el código en la URL (?code=) para que, tras iniciar sesión o
        // registrarse, LoginLink devuelva aquí con el campo ya relleno; y se invita a entrar.
        if (user === null) {
            if (code.trim() !== '') {
                const url = new URL(window.location.href)
                url.searchParams.set('code', code.trim())
                window.history.replaceState(window.history.state, '', url)
            }
            setOpenLogin(true)
            return
        }
        setIsPending(true)
        try {
            const { data } = await API.post<IResponse<RedeemResult>>('/api/coupon/redeem', { code })
            if (data.data.ok) {
                setRedeemed(data.data.pack)
            } else {
                setError(data.data.error)
            }
        } catch (err) {
            setError(isAxiosError(err) && err.response?.status === 429 ? 'demasiados_intentos' : 'servidor')
        } finally {
            setIsPending(false)
        }
    }

    if (redeemed !== null) {
        return (
            <div className='card grid grid-cols-1 gap-4 text-center'>
                <FaTicket className='text-5xl mx-auto text-green-500' />
                <h1 className='text-2xl font-bold'>{t('exito_titulo')}</h1>
                <p>{t.rich('exito', { pack: redeemed.name, b: (chunks) => <span className='font-bold'>{chunks}</span> })}</p>
                <Link href={`/pack/${redeemed.code}`} className='btn-primary w-full font-bold'>{t('ver_pack')}</Link>
                <button
                    type='button'
                    className='btn-primary w-full'
                    onClick={() => { setRedeemed(null); setCode('') }}
                >
                    {t('otro')}
                </button>
            </div>
        )
    }

    return (
        <form className='card grid grid-cols-1 gap-4' onSubmit={handleSubmit}>
            <div className='text-center'>
                <FaTicket className='text-5xl mx-auto pb-2' />
                <h1 className='text-2xl font-bold'>{t('titulo')}</h1>
                <p className='text-sm text-neutral-400 pt-2'>{t('descripcion')}</p>
            </div>
            <div>
                <label htmlFor='code' className='block text-xs font-medium mb-1'>{t('label')}</label>
                <input
                    id='code'
                    className='w-full font-mono uppercase tracking-wider'
                    value={code}
                    placeholder='KYA-XXXX-XXXX-XXXX'
                    autoComplete='off'
                    spellCheck={false}
                    maxLength={40}
                    onChange={(e) => { setCode(e.currentTarget.value); setError(null) }}
                    disabled={isPending}
                    // Sin sesión el campo no es obligatorio: "Canjear" siempre abre el modal de iniciar sesión.
                    required={user !== null}
                    autoFocus
                />
                {error && <p className='text-red-500 text-xs pt-1'>{t(`error.${error}`)}</p>}
            </div>
            <button className='btn-primary w-full font-bold' type='submit' disabled={isPending || (user !== null && code.trim() === '')}>
                {isPending ? t('canjeando') : t('boton')}
            </button>
            <DialogLoginToRedeem open={openLogin} onClose={() => { setOpenLogin(false) }} />
        </form>
    )
}
