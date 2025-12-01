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
     * 
     * IMPORTANT: Si NEXT_PUBLIC_API_URL pointe vers une IP locale (192.168.x.x, 10.x.x.x, etc.),
     * on force l'utilisation du reverse proxy pour éviter les problèmes de Private Network Access.
     */
    get baseUrl(): string {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // En client-side, vérifier si on doit utiliser le reverse proxy
        if (typeof window !== 'undefined') {
            // Si NEXT_PUBLIC_API_URL est défini, vérifier s'il pointe vers une IP locale
            if (apiUrl) {
                try {
                    const url = new URL(apiUrl);
                    const hostname = url.hostname;
                    
                    // Détecter les IPs locales (192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.x.x.x, localhost)
                    const isLocalIP = 
                        hostname === 'localhost' ||
                        hostname === '127.0.0.1' ||
                        hostname.startsWith('192.168.') ||
                        hostname.startsWith('10.') ||
                        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);
                    
                    // Si NEXT_PUBLIC_API_URL pointe vers une IP locale, utiliser le reverse proxy à la place
                    // Cela évite les problèmes de Private Network Access (PNA) du navigateur
                    if (isLocalIP) {
                        console.warn(
                            `[API Config] NEXT_PUBLIC_API_URL pointe vers une IP locale (${apiUrl}). ` +
                            `Utilisation du reverse proxy (${window.location.origin}) pour éviter les problèmes CORS/PNA.`
                        );
                        return window.location.origin;
                    }
                    
                    // Si NEXT_PUBLIC_API_URL pointe vers le même domaine que le frontend, l'utiliser
                    if (apiUrl === window.location.origin) {
                        return window.location.origin;
                    }
                } catch (e) {
                    // Si l'URL n'est pas valide, utiliser window.location.origin
                    console.warn(`[API Config] NEXT_PUBLIC_API_URL invalide (${apiUrl}). Utilisation du reverse proxy.`);
                    return window.location.origin;
                }
            }
            
            // Par défaut, utiliser l'origine actuelle (détecte automatiquement le reverse proxy)
            return window.location.origin;
        }
        
        // Fallback pour SSR - utiliser une variable d'environnement si disponible
        // En production avec reverse proxy, utiliser l'URL du reverse proxy
        return process.env.SSR_API_URL || apiUrl || 'http://localhost:3002';
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
        // 2. On utilise window.location.origin (reverse proxy) OU NEXT_PUBLIC_API_URL pointe vers le reverse proxy
        // 3. L'endpoint normalisé ne commence pas déjà par /api
        const isUsingReverseProxy = 
            typeof window !== 'undefined' && 
            (baseUrl === window.location.origin || !apiUrl || (apiUrl === window.location.origin));
        
        const shouldAddApiPrefix = 
            isUsingReverseProxy &&
            !normalizedEndpoint.startsWith('/api');
        
        if (shouldAddApiPrefix) {
            baseUrl = `${baseUrl}/api`;
        }
        
        const url = `${baseUrl}${normalizedEndpoint}`;
        
        // Log pour débogage (seulement en développement)
        if (process.env.NODE_ENV === 'development') {
            console.log(`[API Config] Fetching: ${url}`, {
                endpoint,
                normalizedEndpoint,
                baseUrl: this.baseUrl,
                shouldAddApiPrefix,
                method: options.method || 'GET',
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
            
            // Log les erreurs en développement
            if (process.env.NODE_ENV === 'development' && !response.ok) {
                console.error(`[API Config] Request failed: ${url}`, {
                    status: response.status,
                    statusText: response.statusText,
                });
            }
            
            return response;
        } catch (error) {
            // Améliorer le message d'erreur pour les erreurs réseau
            if (process.env.NODE_ENV === 'development') {
                console.error(`[API Config] Network error for: ${url}`, error);
            }
            throw error;
        }
    },
};

