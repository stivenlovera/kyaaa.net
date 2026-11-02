import { repositoryPack } from "@/src/app/repositories/pack.repository";
import { getCurrentUser } from "@/src/app/utils/auth";
import { notFound } from "next/navigation";
import { PayPack } from "./components/pay-pack";

export const dynamic = "force-dynamic";
interface PageProps {
    params: Promise<{
        code: string
    }>,
    searchParams: Promise<{
        page: string
    }>
}
export default async function Page({ params }: PageProps) {
    const { code } = await params;

    const user = await getCurrentUser();
    const pack = await repositoryPack.findPackInfo(code, user !== null);

    if (user === null) {
        notFound()
    }

    if (pack === null) {
        notFound()
    }
    
    return (
        <PayPack pack={pack}></PayPack>
    )
}
