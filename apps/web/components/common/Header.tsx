'use client';

import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface HeaderProps {
    title?: string;
    className?: string;
}

export function Header({ title, className = '' }: HeaderProps) {
    const t = useTranslations('Home');

    return (
        <div className={`flex items-center justify-between mb-6 ${className}`}>
            {title && <h1 className="text-3xl font-bold">{title}</h1>}
            <Link href="/home">
                <Button variant="outline" title={t('backToHome')}>
                    <Home className="mr-2 h-4 w-4" />
                    {t('backToHome')}
                </Button>
            </Link>
        </div>
    );
}

