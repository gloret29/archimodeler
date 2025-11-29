// API service for managing views
const API_URL = 'http://localhost:3002';

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
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/model/views`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
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
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/model/views/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get view');
        }

        return response.json();
    },

    async update(id: string, data: UpdateViewDto): Promise<View> {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/model/views/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
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
