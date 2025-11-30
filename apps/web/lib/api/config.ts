/**
 * Configuration centralisée de l'API
 * Utilise NEXT_PUBLIC_API_URL pour l'URL de l'API backend
 * Fallback sur localhost:3002 en développement
 */

export const API_CONFIG = {
    /**
     * URL de base de l'API backend
     * Peut être configurée via la variable d'environnement NEXT_PUBLIC_API_URL
     */
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
    
    /**
     * URL du WebSocket pour la collaboration
     */
    get wsUrl() {
        return `${this.baseUrl}/collaboration`;
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
     */
    async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
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

