import logger, { jsonLog } from "@/src/app/utils/logger";
import { Card } from "../../_components/card";
import { ILikePack } from "@/src/app/types/like-pack.types";
import { IBuyPack } from "@/src/app/types/buy_pack.types";
import { IFavoritePack } from "@/src/app/types/favorite-pack.types";
import { getCurrentUser } from "@/src/app/utils/auth";
import { repositoryLikePack } from "@/src/app/repositories/like-pack.repository";
import { repositoryBuyPack } from "@/src/app/repositories/buy-pack.repository";
import { repositoryFavoritePack } from "@/src/app/repositories/favorite-pack.repository";
import { INewPacksAuth } from "@/src/app/types/pack.types";
import { repositorySerie } from "@/src/app/repositories/serie.repository";

interface PagePaginateProps {
    params: Promise<{
        slug: string
    }>
}

export default async function Page({ params }: PagePaginateProps) {
    const { slug } = await params;
    const user = await getCurrentUser();
    const listPack = await repositorySerie.findAllPerSerie(slug, user !== null)
    logger.info(`serie/${slug} ${jsonLog(listPack)}`)

    let likes: ILikePack[] = []
    let buys: IBuyPack[] = []
    let favorites: IFavoritePack[] = []
    if (user !== null) {
        likes = await repositoryLikePack.findLikePerUser(user!.user_id);
        buys = await repositoryBuyPack.findBuyPerUser(user!.user_id);
        favorites = await repositoryFavoritePack.findFavoritePerUser(user!.user_id);
    }

    const listNewPacks = listPack!.map((pack) => {
        const isLike = likes!.find((like) => like.pack_id === pack.pack_id);
        const isBuy = buys!.find((like) => like.pack_id === pack.pack_id);
        const isFavorite = favorites!.find((like) => like.pack_id === pack.pack_id);
        const newPack: INewPacksAuth = {
            ...pack,
            buy: isBuy !== undefined ? true : false,
            like: isLike !== undefined ? true : false,
            favorite: isFavorite !== undefined ? true : false,
        }
        return newPack
    });

    return (
        <div className="px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14">
            <div className="card">
                <div className="p-3 pt-0" >
                    <h1 className="text-center text-2xl md:text-3xl font-bold">{slug}</h1>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-2 lg:gap-3 xl:gap-4">
                    {
                        listNewPacks.map((pack, i) => {
                            const urlImage = pack.portada.url
                            return (
                                <Card
                                    pack={pack}
                                    urlImage={urlImage}
                                    key={i}
                                ></Card>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}