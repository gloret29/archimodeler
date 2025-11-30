/**
 * Client API réutilisable avec gestion d'erreurs
 * Utilise la configuration centralisée API_CONFIG
 */

import { API_CONFIG } from './config';

export interface ApiError {
    message: string;
    status: number;
    data?: any;
}

export class ApiClientError extends Error {
    status: number;
    data?: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiClientError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Effectue une requête API avec gestion d'erreurs améliorée
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    try {
        const response = await API_CONFIG.fetch(endpoint, options);

        if (!response.ok) {
            let errorData: any = {};
            try {
                errorData = await response.json();
            } catch {
                // Si la réponse n'est pas du JSON, utiliser le texte
                errorData = { message: await response.text() || `HTTP ${response.status}` };
            }

            const errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`;
            throw new ApiClientError(errorMessage, response.status, errorData);
        }

        // Gérer les réponses vides
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text() as unknown as T;
        }
    } catch (error) {
        if (error instanceof ApiClientError) {
            throw error;
        }
        
        // Erreur réseau ou autre
        throw new ApiClientError(
            error instanceof Error ? error.message : 'Network error',
            0,
            error
        );
    }
}

/**
 * Méthodes HTTP helpers
 */
export const api = {
    get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
    
    post: <T>(endpoint: string, data?: any) => 
        apiRequest<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),
    
    put: <T>(endpoint: string, data?: any) => 
        apiRequest<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }),
    
    delete: <T>(endpoint: string) => 
        apiRequest<T>(endpoint, { method: 'DELETE' }),
    
    patch: <T>(endpoint: string, data?: any) => 
        apiRequest<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        }),
};

