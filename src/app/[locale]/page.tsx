import { Metadata } from "next";
import { Welcome } from "./_components/welcome";
import { PageHomeProps } from "./layout";
import { repositoryPack } from "../repositories/pack.repository";
import { getCurrentUser } from "../utils/auth";
import { ILikePack } from "../types/like-pack.types";
import { IBuyPack } from "../types/buy_pack.types";
import { IFavoritePack } from "../types/favorite-pack.types";
import { repositoryLikePack } from "../repositories/like-pack.repository";
import { repositoryBuyPack } from "../repositories/buy-pack.repository";
import { repositoryFavoritePack } from "../repositories/favorite-pack.repository";
import { INewPacksAuth } from "../types/pack.types";
import { Card } from "./_components/card";

export const dynamic = 'force-dynamic';

/* export const metadata: Metadata = {
  title: 'Nuevas entradas',
  description: 'Nuevas entradas del mes de febrero',
} */

type Props = {
  params: Promise<{ id: string }>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Nuevas entradas',
    description: 'Nuevas entradas del mes de febrero',
    openGraph: {
      images: [
        {
          url: 'https://usc1.contabostorage.com/698352ccd113428cb40866703a92c514:static/01.jpeg',
          alt: 'Nuevas entradas',
        },
      ],
    },
  };
}

export default async function Home({ params }: PageHomeProps) {
  /* const { locale } = await params;
  const t = await getTranslations('home'); */

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

  const listNewPacks = packs!.map((pack) => {
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
      <div>
        <Welcome></Welcome>
      </div>
      <div className="card">
        <div className="p-3 pt-0" >
          <h1 className="text-center text-2xl md:text-3xl font-bold">Nuevas entradas</h1>
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
  );
}
