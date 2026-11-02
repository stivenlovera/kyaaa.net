import { notFound } from 'next/navigation';
import { getCurrentAdmin } from '@/src/app/utils/auth';

// Todas las páginas de /admin exigen el rol admin. A quien no lo tiene se le responde 404,
// para no revelar que la sección existe. Las APIs de administración se protegen aparte (adminDenied).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const admin = await getCurrentAdmin();
    if (admin === null) {
        notFound();
    }
    return children;
}
