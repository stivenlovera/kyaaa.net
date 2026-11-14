// proxies/withI18n.ts
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '../i18n/routing';

export function withI18n() {
    return createIntlMiddleware(routing);
};