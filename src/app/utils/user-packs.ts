import { repositoryBuyPack } from "../repositories/buy-pack.repository";
import { repositoryFavoritePack } from "../repositories/favorite-pack.repository";
import { repositoryLikePack } from "../repositories/like-pack.repository";
import { IListPacks, INewPacksAuth } from "../types/pack.types";

/** Añade a cada pack si el usuario le dio "me gusta", lo compró o lo guardó en favoritos (para las tarjetas). */
export async function withUserFlags(packs: IListPacks[], user_id: number): Promise<INewPacksAuth[]> {
    const [likes, buys, favorites] = await Promise.all([
        repositoryLikePack.findLikePerUser(user_id),
        repositoryBuyPack.findBuyPerUser(user_id),
        repositoryFavoritePack.findFavoritePerUser(user_id),
    ]);
    const liked = new Set(likes.map((l) => l.pack_id));
    const bought = new Set(buys.map((b) => b.pack_id));
    const favorite = new Set(favorites.map((f) => f.pack_id));
    return packs.map((pack) => ({
        ...pack,
        like: liked.has(pack.pack_id),
        buy: bought.has(pack.pack_id),
        favorite: favorite.has(pack.pack_id),
    }));
}
