import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Autoriser les requêtes cross-origin en mode développement
    // Nécessaire quand l'application est accessible via un reverse proxy
    // Peut être configuré via NEXT_PUBLIC_ALLOWED_ORIGINS (séparés par des virgules)
    allowedDevOrigins: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS
        ? process.env.NEXT_PUBLIC_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : [
            'localhost',
            '127.0.0.1',
        ],
};

export default withNextIntl(nextConfig);
