'use client'
import { useAuth } from '@/src/providers/AuthContext';
import { useTranslations } from 'next-intl';
export const Welcome = () => {
    const t = useTranslations('home');
    const { user } = useAuth()

    return (
        user !== null ? (
            <div className='text-sm md:text-xl py-3'>{t('bienvenida.title', { nick: user?.nick })} </div>
        ) : (<></>)
    )
}
