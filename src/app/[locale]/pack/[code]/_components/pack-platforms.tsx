import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { IPackPlatform } from "@/src/app/types/platform.types"

interface PackPlatformsProps {
    platforms: IPackPlatform[]
}

// Pósters del pack para otras plataformas (Ko-fi, Patreon…), debajo del botón comprar. Cada uno pasa por
// /api/pack/platform/go, que cuenta el clic y redirige a la publicación del pack en esa plataforma.
export const PackPlatforms = async ({ platforms }: PackPlatformsProps) => {
    if (platforms.length === 0) {
        return null
    }
    const t = await getTranslations('pack-info');
    return (
        <div className="py-2">
            <h5 className="text-md font-bold m-1">{t('plataformas')}:</h5>
            <div className="grid grid-cols-2 gap-2">
                {platforms.map((item) => (
                    <a
                        key={item.pack_platform_id}
                        href={`/api/pack/platform/go?id=${item.pack_platform_id}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
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
                        <span className="block text-center text-sm py-1">{item.platform.name}</span>
                    </a>
                ))}
            </div>
        </div>
    )
}
