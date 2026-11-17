// Tipado de next-intl: las claves de t('...') se comprueban contra los textos en inglés.
// `public/locale/en/common.d.json.ts` lo genera el plugin de next-intl (next.config.ts,
// createMessagesDeclaration) y TypeScript lo usa gracias a `allowArbitraryExtensions`.
import messages from './public/locale/en/common.json';
import { routing } from './src/i18n/routing';

declare module 'next-intl' {
    interface AppConfig {
        Locale: (typeof routing.locales)[number];
        Messages: typeof messages;
    }
}
