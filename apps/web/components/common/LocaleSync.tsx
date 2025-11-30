'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api/client';

/**
 * Component that syncs the current URL locale with the user's preferred locale
 * This ensures all screens react to the user's language choice
 */
export function LocaleSync() {
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();
    const hasSyncedRef = useRef(false);

    useEffect(() => {
        // Only sync once per mount to avoid infinite loops
        if (hasSyncedRef.current) {
            return;
        }

        const syncLocale = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    return; // Not authenticated, no need to sync
                }

                // Only sync on certain pages to avoid interfering with navigation
                // Skip sync on login page and during initial navigation
                if (pathname === '/' || pathname === '/home' || pathname.startsWith('/studio')) {
                    // Don't sync on login page, home page (just after login), or studio (to avoid 404s)
                    return;
                }

                // Small delay to avoid interfering with initial page load and navigation
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Check again if we still need to sync (pathname might have changed)
                if (hasSyncedRef.current) {
                    return;
                }

                const user = await api.get<{ locale?: string }>('/users/me');
                if (user.locale && ['en', 'fr'].includes(user.locale) && user.locale !== currentLocale) {
                    // User's preferred locale differs from current URL locale
                    // Redirect to the same path but with the correct locale
                    hasSyncedRef.current = true;
                    // usePathname from next-intl already returns pathname without locale prefix
                    // Use router.replace with locale option from next-intl
                    router.replace(pathname, { locale: user.locale });
                }
            } catch (error) {
                // Silently fail if user is not authenticated or API call fails
                // This is expected for unauthenticated users
            }
        };

        syncLocale();
    }, [currentLocale, pathname, router]);

    // Reset sync flag when pathname changes to allow re-sync on navigation
    useEffect(() => {
        hasSyncedRef.current = false;
    }, [pathname]);

    return null; // This component doesn't render anything
}

