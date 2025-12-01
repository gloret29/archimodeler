/**
 * Configuration centralisée de l'API
 * Utilise NEXT_PUBLIC_API_URL pour l'URL de l'API backend
 * Si non défini, utilise window.location.origin pour détecter automatiquement
 * l'URL du reverse proxy, sinon fallback sur localhost:3002
 */

export const API_CONFIG = {
    /**
     * URL de base de l'API backend
     * Détecte automatiquement l'URL du reverse proxy via window.location.origin
     * Peut être surchargée via NEXT_PUBLIC_API_URL
     */
    get baseUrl(): string {
        // Si défini explicitement, utiliser la variable d'environnement
        if (process.env.NEXT_PUBLIC_API_URL) {
            return process.env.NEXT_PUBLIC_API_URL;
        }
        
        // En client-side, utiliser l'origine actuelle (détecte automatiquement le reverse proxy)
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        
        // Fallback pour SSR - utiliser une variable d'environnement si disponible
        // En production avec reverse proxy, utiliser l'URL du reverse proxy
        return process.env.SSR_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    },
    
    /**
     * URL du WebSocket pour la collaboration
     * Ajoute automatiquement le préfixe /api si on utilise window.location.origin
     */
    get wsUrl() {
        let baseUrl = this.baseUrl;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Ajouter /api si on utilise window.location.origin (reverse proxy)
        // mais pas si NEXT_PUBLIC_API_URL est défini et pointe directement vers le backend
        if (typeof window !== 'undefined' && (!apiUrl || (apiUrl === window.location.origin))) {
            baseUrl = `${baseUrl}/api`;
        }
        
        // Le backend WebSocket est sur le namespace 'collaboration'
        // Le reverse proxy enlèvera /api avant de transmettre, donc le backend recevra /collaboration
        return `${baseUrl}/collaboration`;
    },
    
    /**
     * Récupère le token d'authentification depuis localStorage
     * TODO: Migrer vers cookies HttpOnly (Bug #1)
     */
    getAuthToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('accessToken');
    },
    
    /**
     * Crée les headers d'authentification pour les requêtes fetch
     */
    getAuthHeaders(additionalHeaders: Record<string, string> = {}): HeadersInit {
        const token = this.getAuthToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...additionalHeaders,
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },
    
    /**
     * Effectue une requête fetch avec authentification automatique
     * Ajoute automatiquement le préfixe /api si on utilise window.location.origin
     * (c'est-à-dire si on est derrière un reverse proxy qui route /api/* vers le backend)
     * 
     * Note: Le backend n'a PAS de préfixe global /api. Le frontend appelle /api/auth/login,
     * le reverse proxy enlève le /api et transmet /auth/login au backend.
     */
    async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
        // Si l'endpoint est une URL complète, l'utiliser telle quelle
        if (endpoint.startsWith('http')) {
            return fetch(endpoint, options);
        }
        
        // Normaliser l'endpoint : enlever le préfixe /api s'il existe déjà
        // pour éviter le double préfixe /api/api/
        let normalizedEndpoint = endpoint;
        if (normalizedEndpoint.startsWith('/api/')) {
            normalizedEndpoint = normalizedEndpoint.substring(4); // Enlever '/api'
        } else if (normalizedEndpoint === '/api') {
            normalizedEndpoint = '/';
        }
        
        // Déterminer si on doit ajouter le préfixe /api
        let baseUrl = this.baseUrl;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // On ajoute /api si :
        // 1. On est en client-side (window existe)
        // 2. NEXT_PUBLIC_API_URL n'est pas défini OU il pointe vers le reverse proxy (contient window.location.origin)
        // 3. L'endpoint normalisé ne commence pas déjà par /api
        const shouldAddApiPrefix = 
            typeof window !== 'undefined' && 
            (!apiUrl || (apiUrl === window.location.origin)) &&
            !normalizedEndpoint.startsWith('/api');
        
        if (shouldAddApiPrefix) {
            baseUrl = `${baseUrl}/api`;
        }
        
        const url = `${baseUrl}${normalizedEndpoint}`;
        
        const headers = this.getAuthHeaders(
            options.headers as Record<string, string> || {}
        );
        
        return fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {}),
            },
        });
    },
};

