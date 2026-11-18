'use client'
import Link from "next/link";
import { useState } from "react";
import { INewPacksAuth } from "../../types/pack.types";
import { Card } from "./card";

interface PackGridProps {
    title: string
    packs: INewPacksAuth[]
    /** Texto y enlace cuando la lista está vacía. */
    empty: { message: string, linkText: string, href: string }
    /** En /favorites: al quitar el favorito, la tarjeta desaparece sin recargar. */
    removeOnUnfavorite?: boolean
    /** Contenido al pie de la tarjeta (p. ej. el enlace "Reportar un problema" de Mis compras). */
    footer?: React.ReactNode
}

/** Título + cuadrícula de tarjetas de packs, con un mensaje si no hay ninguno. */
export function PackGrid({ title, packs: initialPacks, empty, removeOnUnfavorite = false, footer }: PackGridProps) {
    const [packs, setPacks] = useState(initialPacks);

    return (
        <div className="px-2 py-2 md:px-10 lg:px-20 xl:px-64 2xl:px-72 md:py-5 lg:py-10 xl:py-14">
            <div className="card">
                <div className="p-3 pt-0">
                    <h1 className="text-center text-2xl md:text-3xl font-bold">{title}</h1>
                </div>
                {packs.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                        <p className="text-neutral-400">{empty.message}</p>
                        <Link href={empty.href} className="btn-primary">{empty.linkText}</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-2 lg:gap-3 xl:gap-4">
                        {packs.map((pack) => (
                            <Card
                                pack={pack}
                                urlImage={pack.portada.url}
                                key={pack.pack_id}
                                onFavoriteChange={removeOnUnfavorite ? (favorite) => {
                                    if (!favorite) setPacks((list) => list.filter((p) => p.pack_id !== pack.pack_id));
                                } : undefined}
                            ></Card>
                        ))}
                    </div>
                )}
                {footer}
            </div>
        </div>
    );
}
