'use client';

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function ApiDocsPage() {
    const t = useTranslations('Home');
    
    return (
        <div className="w-full h-screen flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-background">
                <h1 className="text-2xl font-bold">API Documentation</h1>
                <Link href="/home">
                    <Button variant="outline" title={t('backToHome')}>
                        <Home className="mr-2 h-4 w-4" />
                        {t('backToHome')}
                    </Button>
                </Link>
            </div>
            <iframe
                src="http://localhost:3002/api-docs"
                className="flex-1 w-full border-0"
                title="API Documentation"
            />
        </div>
    );
}

