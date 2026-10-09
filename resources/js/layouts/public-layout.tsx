import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLayout from '@/layouts/app-layout';

export default function PublicLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage().props;
    if (auth?.user) return <AppLayout>{children}</AppLayout>;
    return (
        <div className="min-h-screen bg-white text-slate-950">
            <header className="mx-auto flex max-w-6xl items-center justify-between border-b px-5 py-5">
                <Link href="/" className="text-xl font-bold">
                    CODELAB
                </Link>
                <Link href="/login" className="text-sm text-indigo-600">
                    Sign in
                </Link>
            </header>
            {children}
        </div>
    );
}
