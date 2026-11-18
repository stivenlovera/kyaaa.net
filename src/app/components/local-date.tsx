'use client'
import { useLocale } from 'next-intl'

/**
 * Fecha y hora en la zona horaria del navegador (en el servidor saldría en la del contenedor).
 * El primer render del servidor puede diferir del cliente: se ignora el aviso de hidratación.
 */
export const LocalDate = ({ date, withTime = true }: { date: Date | string, withTime?: boolean }) => {
    const locale = useLocale()
    const value = new Date(date)
    const text = new Intl.DateTimeFormat(locale, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(value)
    return <time dateTime={value.toISOString()} suppressHydrationWarning>{text}</time>
}
