'use client';

import { useEffect, useRef } from 'react';

interface LiveRegionProps {
    message: string;
    priority?: 'polite' | 'assertive';
    id?: string;
}

/**
 * Composant pour les annonces aux lecteurs d'écran
 * Utilise une région live ARIA pour annoncer les changements d'état
 */
export function LiveRegion({ message, priority = 'polite', id = 'live-region' }: LiveRegionProps) {
    const regionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (message && regionRef.current) {
            // Réinitialiser le contenu pour forcer une nouvelle annonce
            regionRef.current.textContent = '';
            setTimeout(() => {
                if (regionRef.current) {
                    regionRef.current.textContent = message;
                }
            }, 100);
        }
    }, [message]);

    return (
        <div
            ref={regionRef}
            id={id}
            role="status"
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
        />
    );
}

/**
 * Hook pour utiliser une région live
 */
export function useLiveRegion(priority: 'polite' | 'assertive' = 'polite') {
    const announce = (message: string) => {
        const region = document.getElementById('live-region');
        if (region) {
            region.textContent = '';
            setTimeout(() => {
                if (region) {
                    region.textContent = message;
                }
            }, 100);
        }
    };

    return { announce };
}


