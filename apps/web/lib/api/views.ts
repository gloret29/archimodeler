// API service for managing views
import { API_CONFIG } from './config';

export interface View {
    id: string;
    name: string;
    description?: string;
    content?: any;
    modelPackageId: string;
    folderId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateViewDto {
    name: string;
    description?: string;
    content?: any;
    modelPackageId: string;
    folderId?: string;
}

export interface UpdateViewDto {
    name?: string;
    description?: string;
    content?: any;
    folderId?: string;
}

export const viewsApi = {
    async create(data: CreateViewDto): Promise<View> {
        const response = await API_CONFIG.fetch('/model/views', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || 'Failed to create view';
            console.error('API Error:', response.status, errorMessage, errorData);
            throw new Error(`${errorMessage} (Status: ${response.status})`);
        }

        return response.json();
    },

    async get(id: string): Promise<View> {
        const response = await API_CONFIG.fetch(`/model/views/${id}`);

        if (!response.ok) {
            throw new Error('Failed to get view');
        }

        return response.json();
    },

    async update(id: string, data: UpdateViewDto): Promise<View> {
        const response = await API_CONFIG.fetch(`/model/views/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update view');
        }

        return response.json();
    },

    async moveToFolder(viewId: string, folderId: string | null): Promise<View> {
        return this.update(viewId, { folderId: folderId || undefined });
    },

    async rename(viewId: string, newName: string): Promise<View> {
        return this.update(viewId, { name: newName });
    },
};
