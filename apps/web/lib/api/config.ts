/**
 * Configuration centralisée de l'API
 * 
 * Toutes les URLs sont configurées via des variables d'environnement :
 * - NEXT_PUBLIC_API_URL : URL complète du backend API (ex: http://192.168.1.58:3002)
 * - NEXT_PUBLIC_USE_REVERSE_PROXY : 'true' pour utiliser le reverse proxy (ajoute /api), 'false' pour connexion directe
 * - SSR_API_URL : URL du backend pour le rendu côté serveur (SSR)
 * 
 * Si NEXT_PUBLIC_API_URL n'est pas défini, utilise window.location.origin (reverse proxy par défaut)
 */

export const API_CONFIG = {
    /**
     * URL de base de l'API backend
     * 
     * Priorité:
     * 1. NEXT_PUBLIC_API_URL si défini (utilisé tel quel)
     * 2. window.location.origin si en client-side (reverse proxy)
     * 3. SSR_API_URL si en SSR
     * 4. http://localhost:3002 en fallback
     */
    get baseUrl(): string {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Si NEXT_PUBLIC_API_URL est défini, l'utiliser directement
        if (apiUrl) {
            try {
                new URL(apiUrl); // Valider l'URL
                console.log('[API Config] Using explicit API URL:', apiUrl);
                return apiUrl;
            } catch (e) {
                console.warn(`[API Config] NEXT_PUBLIC_API_URL invalide (${apiUrl}). Utilisation du fallback.`, e);
            }
        }
        
        // En développement, utiliser directement le backend sur le port 3002
        if (process.env.NODE_ENV === 'development') {
            console.log('[API Config] Development mode, using direct backend URL');
            return 'http://localhost:3002';
        }
        
        // En client-side, utiliser window.location.origin si disponible (reverse proxy)
        if (typeof window !== 'undefined') {
            const currentOrigin = window.location.origin;
            console.log('[API Config] No explicit API URL, using current origin (reverse proxy):', currentOrigin);
            return currentOrigin;
        }
        
        // En SSR, utiliser SSR_API_URL ou fallback
        const ssrUrl = process.env.SSR_API_URL;
        if (ssrUrl) {
            console.log('[API Config] Using SSR API URL:', ssrUrl);
            return ssrUrl;
        }
        
        // Fallback par défaut
        console.warn('[API Config] No API URL configured, using default fallback');
        return 'http://localhost:3002';
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
     * 
     * Ajoute automatiquement le préfixe /api si on utilise un reverse proxy.
     * Le reverse proxy enlève le /api et transmet la requête au backend.
     * 
     * Note: Le backend n'a PAS de préfixe global /api.
     */
    async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
        // Si l'endpoint est une URL complète, l'utiliser telle quelle
        if (endpoint.startsWith('http')) {
            return fetch(endpoint, options);
        }
        
        // Normaliser l'endpoint : enlever le préfixe /api s'il existe déjà
        let normalizedEndpoint = endpoint;
        if (normalizedEndpoint.startsWith('/api/')) {
            normalizedEndpoint = normalizedEndpoint.substring(4);
        } else if (normalizedEndpoint === '/api') {
            normalizedEndpoint = '/';
        }
        
        // Déterminer si on doit ajouter le préfixe /api
        let baseUrl = this.baseUrl;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Déterminer si on utilise un reverse proxy
        const useReverseProxy = process.env.NEXT_PUBLIC_USE_REVERSE_PROXY === 'true' ||
            (typeof window !== 'undefined' && baseUrl === window.location.origin);
        
        // Ne pas ajouter /api si on utilise explicitement NEXT_PUBLIC_API_URL (connexion directe)
        const isUsingDirectApiUrl = apiUrl && baseUrl === apiUrl;
        
        const shouldAddApiPrefix = 
            useReverseProxy &&
            !isUsingDirectApiUrl &&
            !normalizedEndpoint.startsWith('/api');
        
        if (shouldAddApiPrefix) {
            baseUrl = `${baseUrl}/api`;
        }
        
        const url = `${baseUrl}${normalizedEndpoint}`;
        
        // Log pour débogage
        console.log(`[API Config] Fetching: ${url}`, {
            endpoint,
            normalizedEndpoint,
            baseUrl: this.baseUrl,
            finalBaseUrl: baseUrl,
            shouldAddApiPrefix,
            useReverseProxy,
            method: options.method || 'GET',
        });

        if (process.env.NODE_ENV === 'development') {
            console.log('[API Config] Fetch payload debug', {
                endpoint,
                method: options.method || 'GET',
                hasBody: Boolean(options.body),
                headers: options.headers,
            });
        }
        
        const headers = this.getAuthHeaders(
            options.headers as Record<string, string> || {}
        );
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...(options.headers || {}),
                },
            });
            
            // Log les erreurs
            if (!response.ok) {
                console.error(`[API Config] Request failed: ${url}`, {
                    status: response.status,
                    statusText: response.statusText,
                    endpoint,
                    baseUrl: this.baseUrl,
                });
            }
            
            return response;
        } catch (error) {
            const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : 'unknown';

            console.error(`[API Config] Network error for: ${url}`, {
                error,
                endpoint,
                baseUrl: this.baseUrl,
                finalBaseUrl: baseUrl,
                useReverseProxy,
                isOnline,
                timestamp: new Date().toISOString(),
            });
            throw error;
        }
    },
};
