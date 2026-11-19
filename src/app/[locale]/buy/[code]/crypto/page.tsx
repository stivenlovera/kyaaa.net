import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { getCurrentUser } from "@/src/app/utils/auth";
import { notFound } from "next/navigation";
import { CryptoStatus } from "./crypto-status";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ code: string }>
    searchParams: Promise<{ order?: string }>
}

// Vuelta desde NOWPayments: el pago se confirma por webhook, así que aquí solo se espera a que llegue.
export default async function Page({ params, searchParams }: PageProps) {
    const { code } = await params;
    const { order } = await searchParams;

    const user = await getCurrentUser();
    const orderId = Number(order);
    if (user === null || !Number.isInteger(orderId)) {
        notFound();
    }
    const pack = await repositoryPack.findPackInfo(code, true);
    if (pack === null) {
        notFound();
    }

    return <CryptoStatus orderId={orderId} code={pack.code} name={pack.name} thanksImage={pack.thanks_image} />;
}
