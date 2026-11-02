import Image from "next/image"
import Link from "next/link"
import { CardSection } from "../../_components/card-section"
import moment from "moment"
import { IPackInfoPage } from "@/src/app/types/pack.types"
/* import { skeleton } from "@/src/app/utils/skeleton" */
import { repositoryPack } from "@/src/app/repositories/pack.repository"
import { repositoryCharacter } from "@/src/app/repositories/character.repository"
import { repositorySerie } from "@/src/app/repositories/serie.repository"
import { repositoryLabel } from "@/src/app/repositories/label.repository"
import { repositoryAuthor } from "@/src/app/repositories/author.repository"
import { repositoryPage } from "@/src/app/repositories/pages.repository"
import { getCurrentUser } from "@/src/app/utils/auth"
import { getTranslations } from "next-intl/server"
import { NumericPagination } from "./numeric-pagination"
import { ExtraPack } from "./extras-pack"
import { ILikePack } from "@/src/app/types/like-pack.types"
import { IBuyPack } from "@/src/app/types/buy_pack.types"
import { IFavoritePack } from "@/src/app/types/favorite-pack.types"
import { repositoryLikePack } from "@/src/app/repositories/like-pack.repository"
import { repositoryBuyPack } from "@/src/app/repositories/buy-pack.repository"
import { repositoryFavoritePack } from "@/src/app/repositories/favorite-pack.repository"
import { notFound } from "next/navigation"
import { repositoryPlatform } from "@/src/app/repositories/platform.repository"
import { PackPlatforms } from "./pack-platforms"

interface PreviewPackProps {
    code: string
    /** Página del listado de miniaturas (empieza en 1). */
    currentPage?: number
}

export const PreviewPack = async ({ code, currentPage = 1 }: PreviewPackProps) => {
    const t = await getTranslations('pack-info');
    const user = await getCurrentUser();
    const pack = await repositoryPack.findPackInfo(code, user !== null);
    if (pack===null) {
        notFound()
    }

    const characters: number[] = [];
    pack?.pack_character.map(({ character }) => {
        characters.push(character.character_id)
    })
    const totalCharacter = await repositoryCharacter.findTotal(characters);

    const series: number[] = [];
    pack?.pack_serie.map(({ serie }) => {
        series.push(serie.serie_id)
    })
    const totalSeries = await repositorySerie.findTotal(series);

    const labels: number[] = [];
    pack?.pack_label.map(({ label }) => {
        labels.push(label.label_id)
    })
    const totalLabel = await repositoryLabel.findTotal(labels);

    const authors: number[] = [];
    pack?.pack_authors.map(({ author }) => {
        authors.push(author.author_id)
    })
    const totalAuthor = await repositoryAuthor.findTotal(authors);

    // Solo las páginas que este usuario puede ver (las gratis, o todas si el pack es gratuito o lo compró).
    const pack_page = await repositoryPage.findPagesPack(code, 1, user?.user_id);
    if (pack_page === null) {
        notFound()
    }
    let likes: ILikePack[] = []
    let buys: IBuyPack[] = []
    let favorites: IFavoritePack[] = []
    if (user !== null) {
        likes = await repositoryLikePack.findLikePerUser(user!.user_id);
        buys = await repositoryBuyPack.findBuyPerUser(user!.user_id);
        favorites = await repositoryFavoritePack.findFavoritePerUser(user!.user_id);
    }
    const platforms = await repositoryPlatform.findByPack(pack!.pack_id);
    const isLike = likes!.find((like) => like.pack_id === pack!.pack_id);
    const isBuy = buys!.find((like) => like.pack_id === pack!.pack_id);
    const isFavorite = favorites!.find((like) => like.pack_id === pack!.pack_id);
    const packInfo: IPackInfoPage = {
        ...pack!,
        total_characters: totalCharacter,
        total_series: totalSeries,
        total_labels: totalLabel,
        total_authors: totalAuthor,
        pages: pack_page.pages,
        buy: isBuy !== undefined ? true : false,
        like: isLike !== undefined ? true : false,
        favorite: isFavorite !== undefined ? true : false,
    }

    const imageDescription = packInfo.portada.url
    const saltos: number = 40;
    const totalPages = Math.max(1, Math.ceil(packInfo.pages!.length / saltos));
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const pagePages = packInfo.pages!.slice((page - 1) * saltos, page * saltos);

    return (
        <div className='px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14'>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 pb-2">
                <div
                    className=""
                >
                    <Link
                        href={`/pack/${packInfo?.code}?page=${packInfo.portada.num}`}
                        className="flex flex-row justify-center md:justify-end"
                    >
                        {imageDescription ? (
                            <Image
                                width={400}
                                height={500}
                                className='h-3/4 w-3/4 p-1'
                                alt={`Preview ${packInfo?.name}`}
                                fetchPriority="high"
                                unoptimized
                                priority
                                src={imageDescription}
                            />
                        ) : (
                            // Sin portada visible para este usuario (ver utils/pack-portada.ts).
                            <div className='w-3/4 aspect-[4/5] p-1 bg-neutral-900' />
                        )}
                    </Link>
                </div>
                <div className="card">
                    <div className="p-1">
                        <h4 className={'text-2xl font-bold'}>{packInfo?.name}</h4>
                    </div>
                    <div className="p-1">
                        <h5 className={'text-lg '}>{packInfo?.code}</h5>
                    </div>
                    <CardSection
                        datos={packInfo!.total_series!}
                        nameSection={t('serie')}
                        route='serie'
                    />
                    <CardSection
                        datos={packInfo!.total_characters!}
                        nameSection={t('personaje')}
                        route='character'
                    />
                    <CardSection
                        datos={packInfo!.total_labels!}
                        nameSection={t('etiqueta')}
                        route='label'
                    />
                    <CardSection
                        datos={packInfo!.total_authors!}
                        nameSection={t('autor')}
                        route='author'
                    />
                    {/*  <CardSection
                            datos={tagLanguages}
                            nameSection={('language')}
                            route='language'
                        />
                        <CardSection
                            datos={tagTypes}
                            nameSection={('tipo')}
                            route='type'
                        /> */}
                    <div className="">
                        <div className="flex mx-auto flex-wrap py-1">
                            <div className="m-1">
                                <h5 className="text-md font-bold">{t('paginas_gratis')}:</h5>
                            </div>
                            <div className="mt-2">
                                <h5 className={"text-sm mx-1 w-full "}>
                                    {
                                        pack_page.free === 0 ? ('') : (pack_page.free)
                                    }
                                </h5>
                            </div>
                        </div>
                    </div>
                    <div className="">
                        <div className="flex mx-auto flex-wrap py-1">
                            <div className="m-1">
                                <h5 className="text-md font-bold">{t('paginas')}:</h5>
                            </div>
                            <div className="mt-2">
                                <h5 className={"text-sm mx-1 w-full "}>
                                    {
                                        pack_page.total === 0 ? ('') : (pack_page.total)
                                    }
                                </h5>
                            </div>
                        </div>
                    </div>

                    <div className="">
                        <div className="flex mx-auto flex-wrap py-1">
                            <div className="m-1">
                                <h5 className="text-md font-bold">{t('actualizado')}:</h5>
                            </div>
                            <div className="mt-2">
                                <h5 className={"text-sm mx-1 w-full"}>
                                    {
                                        packInfo?.name === '' ? ('') : (moment(packInfo!.update_at).format('DD/MM/yyyy hh:mm'))
                                    }
                                </h5>
                            </div>
                        </div>
                    </div>
                    <ExtraPack
                        code={code}
                        price={packInfo.price_list}
                        pack_id={packInfo.pack_id}
                        user_buy={packInfo.buy}
                        free={pack_page.is_free}
                        user_favorite={packInfo.favorite}
                        user_like={packInfo.like}
                        register_image={packInfo.register_image}
                    ></ExtraPack>
                    <PackPlatforms platforms={platforms} />
                </div>
            </div>
            <div id="paginas" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 scroll-mt-16">
                {
                    pagePages.map((image) => (
                        <div
                            className="flex p-1 sm:p-1 md:p-1 lg:p-2 xl:p-2 justify-center w-full"
                            key={image.num}
                        >
                            <Link
                                href={`/pack/${packInfo?.code}?page=${image.num}`}
                                className=""
                            >
                                <Image
                                    fetchPriority="high"
                                    src={image.url}
                                    alt={`pagina ${image.num}`}
                                    width={270}
                                    height={347}
                                    unoptimized
                                    priority
                                />
                            </Link>
                        </div>
                    ))
                }
            </div>
            {!pack_page.full_access && pack_page.total > pack_page.pages.length && (
                <div className="flex mx-auto flex-wrap items-center justify-center gap-2 py-4 text-center">
                    <span>{t('paginas_bloqueadas', { count: pack_page.total - pack_page.pages.length })}</span>
                </div>
            )}
            <NumericPagination
                code={packInfo.code}
                page={page}
                totalPages={totalPages}
                anchor="paginas"
            />
        </div >
    )
}