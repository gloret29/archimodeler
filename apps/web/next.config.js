import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Autoriser les requêtes cross-origin en mode développement
    // Nécessaire quand l'application est accessible via un reverse proxy
    allowedDevOrigins: [
        'archi.gloret.fr',
        '192.168.1.108',
        'localhost',
        '127.0.0.1',
    ],
};

export default withNextIntl(nextConfig);
