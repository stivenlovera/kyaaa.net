import { IResponse } from '@/src/app/types/response';
import { NextRequest, NextResponse } from 'next/server';
import logger, { jsonLog } from '@/src/app/utils/logger';
import { getCurrentUser } from '@/src/app/utils/auth';
import { repositoryPack } from '@/src/app/repositories/pack.repository';
import { INewPacksAuth } from '@/src/app/types/pack.types';
import { repositoryLikePack } from '@/src/app/repositories/like-pack.repository';
import { ILikePack } from '@/src/app/types/like-pack.types';
import { IBuyPack } from '@/src/app/types/buy_pack.types';
import { IFavoritePack } from '@/src/app/types/favorite-pack.types';
import { repositoryBuyPack } from '@/src/app/repositories/buy-pack.repository';
import { repositoryFavoritePack } from '@/src/app/repositories/favorite-pack.repository';

export async function GET(request: NextRequest) {

    logger.info(`api/packs/new GET ${jsonLog([])}`)
    try {
        const user = await getCurrentUser();
        const packs = await repositoryPack.findPacksNew(user !== null);
        let likes: ILikePack[] = []
        let buys: IBuyPack[] = []
        let favorites: IFavoritePack[] = []

        if (user !== null) {
            likes = await repositoryLikePack.findLikePerUser(user!.user_id);
            buys = await repositoryBuyPack.findBuyPerUser(user!.user_id);
            favorites = await repositoryFavoritePack.findFavoritePerUser(user!.user_id);
        }

        const lista = packs!.map((pack) => {
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

        const resp: IResponse<INewPacksAuth[]> = {
            data: lista,
            message: 'Lista de packs',
            success: true
        }
        return NextResponse.json(resp,
            { status: 200 }
        );
    } catch (error: any) {
        logger.error(`api/packs/new error=> ${jsonLog(error.message )}`)
        return NextResponse.json(
            { success: false, message: error.message || 'Login failed' },
            { status: 500 }
        );
    }
}