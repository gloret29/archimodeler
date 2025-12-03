'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

/**
 * Composant "Skip to content" pour la navigation au clavier
 * Permet aux utilisateurs de clavier de sauter directement au contenu principal
 */
export function SkipToContent() {
    const t = useTranslations('Accessibility');
    const skipLinkRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        // Focus automatique sur le lien au chargement de la page
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab' && !e.shiftKey && document.activeElement === document.body) {
                skipLinkRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const mainContent = document.querySelector('main, [role="main"], #main-content');
        if (mainContent) {
            (mainContent as HTMLElement).focus();
            (mainContent as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <a
            ref={skipLinkRef}
            href="#main-content"
            onClick={handleClick}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={t('skipToContent')}
        >
            {t('skipToContent')}
        </a>
    );
}








