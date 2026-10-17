import { usePage } from '@inertiajs/react';
import AuthLoginLayout from '@/layouts/auth/auth-login-layout';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    const AuthLayoutTemplate = usePage().component === 'auth/login' ? AuthLoginLayout : AuthSimpleLayout;

    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
        </AuthLayoutTemplate>
    );
}
