
import { getTranslations } from "next-intl/server";
import { getAbc } from "../../utils/get_abc";
import Link from "next/link";
import { repositoryLabel } from "../../repositories/label.repository";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('etiqueta');
    return { title: t('titulo'), description: t('descripcion') };
}

export default async function Page() {
    const t = await getTranslations('etiqueta');
    const labels = await repositoryLabel.findAllAndTotal();
    const names = labels?.map((c) => { return c.name })
    const slugs = labels?.map((c) => { return c.slug })
    const totals = labels?.map((c) => { return c.total })
    const abc = getAbc({ name: names!, slug: slugs!, total: totals! })

    return (
        <div className="px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14 flex justify-center">
            <div className="card md:w-2xl w-full">
                <div className="p-3 pt-0" >
                    <h1 className="text-center text-2xl md:text-3xl font-bold">{t('titulo')}</h1>
                </div>
                <div className="flex flex-wrap">
                    {
                        abc.map((abc, index) => {
                            return (
                                <div key={index} className="p-2 min-w-full md:min-w-1/2">
                                    <div className="border rounded-xl border-neutral-700">
                                        <div className="px-2 text-lg text-center font-bold">
                                            {abc.name}
                                        </div>
                                        <div className="">
                                            {abc.data.name.map((name, i) => {
                                                return (
                                                    <div key={i}>
                                                        <Link
                                                            className='flex p-1'
                                                            href={`/label/${abc.data.slug.at(i)}`}
                                                        >
                                                            <div className='rounded-l bg-gray-700 px-2 w-full'>
                                                                {name}
                                                            </div>
                                                            <div className='border-2 border-transparent rounded-r bg-gray-600 px-1'>
                                                                {abc.data.total[i]}
                                                            </div>
                                                        </Link>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}