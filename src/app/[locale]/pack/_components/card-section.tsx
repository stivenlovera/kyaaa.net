import Link from "next/link"
import { skeleton } from "@/src/app/utils/skeleton"

export interface ICountTag {
    name: string
    count: number
    slug: string
}
interface CardSectionProps {
    datos: ICountTag[]
    nameSection: string
    route: string
}
export const CardSection = ({ datos, nameSection, route }: CardSectionProps) => {
    return (
        // mb-2: 8px entre secciones; gap-y-1: 4px entre filas de chips cuando una sección baja de línea.
        <div className='mb-2'>
            <div className="flex mx-auto flex-wrap flex-row items-center gap-y-1 text-sm">
                <div className="mx-1 font-bold">
                    <h5>{nameSection}:</h5>
                </div>
                {datos.length > 0 ? (<></>) : (<div className={'mx-1 flex w-40 ' + skeleton('')}></div>)}
                {
                    datos?.map((val, i) => {
                        //const traslate = languajeToSpanish(val.name)
                        return (
                            <div
                                key={i}
                                className="mx-1">
                                {/* <TagInformation
                                            quantity={val.count}
                                            url={`/${route}/${val.name}`}
                                            value={val.name}
                                        /> */}
                                <Link
                                    className='flex'
                                    href={`/${route}/${val.slug}`}
                                >
                                    <div className='rounded-l bg-gray-700 px-2'>
                                        {val.name}
                                    </div>
                                    <div className='border-2 border-transparent rounded-r bg-gray-600 px-1'>
                                        {val.count}
                                    </div>
                                </Link>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}