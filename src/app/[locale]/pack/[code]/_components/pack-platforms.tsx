import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { IPackPlatform } from "@/src/app/types/platform.types"

interface PackPlatformsProps {
    platforms: IPackPlatform[]
}

// Pósters del pack para otras plataformas, debajo del botón comprar, en dos secciones según
// platform.is_payment: "Compra también por" (con pasarela de pago: Ko-fi, Patreon…) y "Síguenos en"
// (redes sociales). Cada uno pasa por /api/pack/platform/go, que cuenta el clic y redirige a la
// publicación del pack en esa plataforma.
// Una plataforma externa (de un tercero) abre en pestaña nueva y con nofollow; una propia, en la misma
// pestaña y sin rel, para que se navegue y se indexe como un enlace interno.
const linkProps = (isExternal: boolean) => isExternal
    ? { target: '_blank', rel: 'noopener noreferrer nofollow' }
    : {}

const PlatformSection = ({ title, items }: { title: string, items: IPackPlatform[] }) => {
    if (items.length === 0) {
        return null
    }
    return (
        <div className="py-2">
            <h5 className="text-sm font-bold m-1">{title}:</h5>
            {/* 4 pósters por fila en móvil y 5 desde md. */}
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                {items.map((item) => (
                    <a
                        key={item.pack_platform_id}
                        href={`/api/pack/platform/go?id=${item.pack_platform_id}`}
                        {...linkProps(item.platform.is_external === 1)}
                        className="group block rounded overflow-hidden bg-neutral-900"
                        title={item.title ?? item.platform.name}
                    >
                        <Image
                            src={item.poster}
                            alt={item.title ?? item.platform.name}
                            width={400}
                            height={500}
                            className="w-full h-auto transition-opacity group-hover:opacity-80"
                            unoptimized
                        />
                        <span className="block text-center text-xs md:text-sm py-1 px-1 truncate">{item.platform.name}</span>
                    </a>
                ))}
            </div>
        </div>
    )
}

export const PackPlatforms = async ({ platforms }: PackPlatformsProps) => {
    if (platforms.length === 0) {
        return null
    }
    const t = await getTranslations('pack-info');
    return (
        <>
            <PlatformSection title={t('compra-tambien')} items={platforms.filter((p) => p.platform.is_payment === 1)} />
            <PlatformSection title={t('siguenos')} items={platforms.filter((p) => p.platform.is_payment !== 1)} />
        </>
    )
}
