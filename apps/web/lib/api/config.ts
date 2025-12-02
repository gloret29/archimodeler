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
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const currentOrigin = window.location.origin;
            
            // Log pour débogage (toujours actif pour aider au débogage du reverse proxy)
            console.log('[API Config] Determining baseUrl:', {
                apiUrl,
                isLocalhost,
                currentOrigin,
                hostname: window.location.hostname,
            });
            
            // Si NEXT_PUBLIC_API_URL est défini, l'utiliser directement en développement local
            // En développement local (localhost:3000), on peut accéder directement au backend
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
                    
                    // En développement local (frontend sur localhost), utiliser directement NEXT_PUBLIC_API_URL
                    // même si c'est une IP locale, car on peut accéder directement au backend
                    if (isLocalhost) {
                        console.log('[API Config] Using direct API URL (localhost):', apiUrl);
                        return apiUrl;
                    }
                    
                    // Si on n'est PAS en développement local (probablement derrière un reverse proxy),
                    // et que NEXT_PUBLIC_API_URL pointe vers une IP locale, utiliser le reverse proxy
                    // Cela évite les problèmes de Private Network Access (PNA) du navigateur
                    if (isLocalIP) {
                        console.warn(
                            `[API Config] NEXT_PUBLIC_API_URL pointe vers une IP locale (${apiUrl}). ` +
                            `Utilisation du reverse proxy (${currentOrigin}) pour éviter les problèmes CORS/PNA.`
                        );
                        return currentOrigin;
                    }
                    
                    // Si NEXT_PUBLIC_API_URL pointe vers le même domaine que le frontend, l'utiliser
                    if (apiUrl === currentOrigin) {
                        console.log('[API Config] Using same origin as frontend:', currentOrigin);
                        return currentOrigin;
                    }
                    
                    // Si NEXT_PUBLIC_API_URL pointe vers un domaine externe, l'utiliser tel quel
                    console.log('[API Config] Using external API URL:', apiUrl);
                    return apiUrl;
                } catch (e) {
                    // Si l'URL n'est pas valide, utiliser window.location.origin en production
                    // ou localhost:3002 en développement
                    console.warn(`[API Config] NEXT_PUBLIC_API_URL invalide (${apiUrl}). Utilisation du fallback.`, e);
                    if (isLocalhost) {
                        return 'http://localhost:3002';
                    }
                    return currentOrigin;
                }
            }
            
            // Si NEXT_PUBLIC_API_URL n'est pas défini, utiliser window.location.origin (reverse proxy)
            // sauf en développement local où on utilise localhost:3002
            if (isLocalhost) {
                console.log('[API Config] No API URL defined, using localhost fallback');
                return 'http://localhost:3002';
            }
            
            // Par défaut, utiliser l'origine actuelle (détecte automatiquement le reverse proxy)
            console.log('[API Config] No API URL defined, using current origin (reverse proxy):', currentOrigin);
            return currentOrigin;
        }
        
        // Fallback pour SSR - utiliser une variable d'environnement si disponible
        // En production avec reverse proxy, utiliser l'URL du reverse proxy
        return process.env.SSR_API_URL || apiUrl || 'http://localhost:3002';
    },
    
    /**
     * URL de base pour Socket.io (sans namespace)
     * Ajoute automatiquement le préfixe /api si on utilise window.location.origin (reverse proxy)
     * En développement local, utilise directement le backend sans préfixe /api
     */
    get wsBaseUrl() {
        let baseUrl = this.baseUrl;
        
        // Ajouter /api UNIQUEMENT si on utilise window.location.origin (reverse proxy)
        // Pas si on utilise directement NEXT_PUBLIC_API_URL (développement local)
        const isUsingReverseProxy = 
            typeof window !== 'undefined' && 
            baseUrl === window.location.origin;
        
        if (isUsingReverseProxy) {
            baseUrl = `${baseUrl}/api`;
        }
        
        return baseUrl;
    },
    
    /**
     * URL complète du WebSocket pour la collaboration (compatibilité)
     * @deprecated Utiliser wsBaseUrl avec le namespace séparé dans getSocketIOOptions
     */
    get wsUrl() {
        // Pour compatibilité avec le code existant, retourner l'URL complète
        // Mais Socket.io devrait utiliser wsBaseUrl avec le namespace séparé
        return `${this.wsBaseUrl}/collaboration`;
    },
    
    /**
     * Options Socket.io pour la connexion WebSocket
     * Configure correctement le path et le namespace pour fonctionner avec le reverse proxy
     * 
     * IMPORTANT: NestJS avec @WebSocketGateway({ namespace: '/collaboration' }) attend les requêtes sur:
     * - /socket.io/?EIO=4&transport=polling&ns=/collaboration (format standard Socket.io)
     * 
     * Mais socket.io-client avec io('url/collaboration') construit /collaboration/socket.io/ au lieu de /socket.io/?ns=/collaboration
     * 
     * Solution: Utiliser l'URL de base SANS le namespace et laisser Socket.io gérer le namespace via le paramètre ns
     * 
     * STRATÉGIE POUR REVERSE PROXY:
     * - Commencer par polling (HTTP) qui fonctionne mieux avec les reverse proxies
     * - Upgrader automatiquement vers WebSocket une fois la connexion établie
     * - Cela évite les problèmes de timeout avec les reverse proxies qui nécessitent un handshake HTTP initial
     */
    getSocketIOOptions(namespace: string = '/collaboration') {
        const wsBaseUrl = this.wsBaseUrl;
        const isUsingReverseProxy = 
            typeof window !== 'undefined' && 
            this.baseUrl === window.location.origin;
        
        // Options Socket.io optimisées pour le reverse proxy
        // STRATÉGIE: Commencer par polling (HTTP) puis upgrade vers WebSocket
        // Cela fonctionne mieux avec les reverse proxies qui nécessitent un handshake HTTP initial
        const options: any = {
            // Commencer par polling (HTTP) pour le handshake initial
            // C'est plus fiable avec les reverse proxies qui peuvent avoir des problèmes avec WebSocket direct
            transports: ['polling', 'websocket'],
            upgrade: true, // Permettre l'upgrade automatique de polling vers WebSocket
            rememberUpgrade: true, // Se souvenir de l'upgrade pour les reconnexions
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 15, // Plus de tentatives pour le reverse proxy
            timeout: 30000, // Timeout augmenté à 30s pour le reverse proxy (handshake HTTP initial)
            // Path Socket.io - doit correspondre à la config backend
            path: '/socket.io/',
            // Spécifier explicitement le namespace pour éviter les problèmes de parsing d'URL
            // Socket.io utilisera: wsBaseUrl + path + namespace
            // Ex: http://localhost:3002/socket.io/?EIO=4&transport=polling&ns=/collaboration
            // Ne PAS inclure le namespace dans l'URL de base, utiliser l'option namespace à la place
            forceNew: false, // Laisser Socket.io réutiliser les connexions si possible
        };
        
        // Log détaillé pour débogage (seulement en développement et une seule fois)
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            // Utiliser une variable globale pour ne logger qu'une seule fois
            const logKey = `ws-config-logged-${wsBaseUrl}-${namespace}`;
            if (!(window as any)[logKey]) {
                (window as any)[logKey] = true;
                console.log('[WebSocket Config] Socket.io configuration:', {
                    wsBaseUrl,
                    namespace,
                    isUsingReverseProxy,
                    baseUrl: this.baseUrl,
                    windowOrigin: window.location.origin,
                    protocol: window.location.protocol,
                    hostname: window.location.hostname,
                    transports: options.transports,
                    timeout: options.timeout,
                    path: options.path,
                    reconnectionAttempts: options.reconnectionAttempts,
                    expectedUrl: `${wsBaseUrl}${options.path}?EIO=4&transport=polling&ns=${namespace}`,
                    note: isUsingReverseProxy 
                        ? 'Using reverse proxy - starting with polling for better compatibility'
                        : 'Direct connection - can use WebSocket directly',
                });
            }
        }
        
        return options;
    },
    
    /**
     * Crée une connexion Socket.io avec la configuration optimale pour le reverse proxy
     * Utilise l'URL de base et ajoute le namespace '/collaboration'
     * 
     * @param namespace Le namespace Socket.io (par défaut '/collaboration')
     * @returns L'URL complète pour Socket.io avec le namespace
     */
    getSocketIOUrl(namespace: string = '/collaboration'): string {
        const baseUrl = this.wsBaseUrl;
        // Socket.io attend le namespace dans l'URL : baseUrl + namespace
        // Exemple: 'http://domain.com/api' + '/collaboration' = 'http://domain.com/api/collaboration'
        // Socket.io ajoutera automatiquement '/socket.io/' pour le handshake
        return `${baseUrl}${namespace}`;
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
     * En développement local, on appelle directement /auth/login sans préfixe /api.
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
        
        // On ajoute /api UNIQUEMENT si :
        // 1. On est en client-side (window existe)
        // 2. On utilise window.location.origin (reverse proxy) - PAS si on utilise directement NEXT_PUBLIC_API_URL
        // 3. L'endpoint normalisé ne commence pas déjà par /api
        const isUsingReverseProxy = 
            typeof window !== 'undefined' && 
            baseUrl === window.location.origin;
        
        const shouldAddApiPrefix = 
            isUsingReverseProxy &&
            !normalizedEndpoint.startsWith('/api');
        
        if (shouldAddApiPrefix) {
            baseUrl = `${baseUrl}/api`;
        }
        
        const url = `${baseUrl}${normalizedEndpoint}`;
        
        // Log pour débogage (toujours actif pour aider au débogage du reverse proxy)
        console.log(`[API Config] Fetching: ${url}`, {
            endpoint,
            normalizedEndpoint,
            baseUrl: this.baseUrl,
            finalBaseUrl: baseUrl,
            shouldAddApiPrefix,
            isUsingReverseProxy,
            method: options.method || 'GET',
            windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        });

        if (process.env.NODE_ENV === 'development') {
            console.log('[API Config] Fetch payload debug', {
                endpoint,
                method: options.method || 'GET',
                hasBody: Boolean(options.body),
                headers: options.headers,
                isOnline: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
                connectionType: typeof navigator !== 'undefined' && 'connection' in navigator
                    ? (navigator as any).connection?.effectiveType
                    : 'unknown',
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
            
            // Log les erreurs (toujours actif pour aider au débogage)
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
            // Améliorer le message d'erreur pour les erreurs réseau
            const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : 'unknown';
            const connectionInfo = typeof navigator !== 'undefined' && 'connection' in navigator
                ? (navigator as any).connection?.effectiveType
                : 'unknown';

            console.error(`[API Config] Network error for: ${url}`, {
                error,
                endpoint,
                baseUrl: this.baseUrl,
                finalBaseUrl: baseUrl,
                isUsingReverseProxy,
                windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
                isOnline,
                connectionInfo,
                timestamp: new Date().toISOString(),
            });
            throw error;
        }
    },
};

