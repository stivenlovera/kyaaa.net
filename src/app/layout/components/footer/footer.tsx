import { IconType } from "react-icons";
import { FaGlobe } from "react-icons/fa";
import { SiDiscord, SiFacebook, SiGumroad, SiInstagram, SiKofi, SiPatreon, SiPixiv, SiX } from "react-icons/si";
import { repositoryPlatform } from "@/src/app/repositories/platform.repository";

// Icono por slug de la tabla platform; una plataforma nueva sin entrada aquí usa el genérico.
const ICONS: Record<string, IconType> = {
    'ko-fi': SiKofi,
    'patreon': SiPatreon,
    'facebook': SiFacebook,
    'instagram': SiInstagram,
    'x': SiX,
    'gumroad': SiGumroad,
    'pixiv': SiPixiv,
    'discord': SiDiscord,
};

// Footer del sitio: copyright a la izquierda e iconos de las plataformas externas
// (platform.is_external = 1, activas) a la derecha, enlazando a su base_url.
export default async function Footer() {
    const platforms = await repositoryPlatform.findExternal();

    return (
        <footer className='bg-neutral-800 p-2 flex items-center justify-between gap-4 text-sm'>
            <p>&copy; 2027 kyaaa</p>
            {platforms.length > 0 && (
                <ul className='flex items-center gap-3'>
                    {platforms.map((platform) => {
                        const Icon = ICONS[platform.slug] ?? FaGlobe;
                        const icon = <Icon className='size-5' aria-hidden />;
                        return (
                            <li key={platform.platform_id}>
                                {platform.base_url ? (
                                    <a
                                        href={platform.base_url}
                                        target='_blank'
                                        rel='noopener noreferrer nofollow'
                                        title={platform.name}
                                        aria-label={platform.name}
                                        className='block text-neutral-400 transition-colors hover:text-white'
                                    >
                                        {icon}
                                    </a>
                                ) : (
                                    <span title={platform.name} className='block text-neutral-400'>{icon}</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </footer>
    );
}
