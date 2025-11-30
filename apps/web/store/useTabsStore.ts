/**
 * @fileoverview Store Zustand pour gérer les onglets de vues.
 * 
 * Gère l'état des onglets ouverts, l'onglet actif, et les opérations
 * de création, sauvegarde et fermeture d'onglets.
 */

import { create } from 'zustand';
import { viewsApi, CreateViewDto } from '@/lib/api/views';

/**
 * Interface représentant un onglet de vue.
 * 
 * @interface ViewTab
 */
export interface ViewTab {
    id: string;
    viewId: string;
    viewName: string;
    packageId: string;
    folderId?: string;
    isPersisted: boolean; // Whether the view exists in the database
    isModified: boolean; // Whether the view has been modified since last save
}

/**
 * Interface du store Zustand pour les onglets.
 * 
 * @interface TabsStore
 */
interface TabsStore {
    /** Liste des onglets ouverts */
    tabs: ViewTab[];
    /** ID de l'onglet actif (null si aucun) */
    activeTabId: string | null;

    // Actions
    /** Ajoute un nouvel onglet à la liste */
    addTab: (tab: ViewTab) => void;
    /** Crée un nouvel onglet avec persistance en base de données */
    addTabWithPersistence: (name: string, packageId: string, folderId?: string) => Promise<ViewTab>;
    /** Supprime un onglet de la liste */
    removeTab: (tabId: string) => void;
    /** Définit l'onglet actif */
    setActiveTab: (tabId: string) => void;
    /** Met à jour le nom d'un onglet */
    updateTabName: (tabId: string, newName: string) => Promise<void>;
    /** Met à jour le dossier d'un onglet */
    updateTabFolder: (tabId: string, folderId: string | null) => Promise<void>;
    /** Sauvegarde le contenu de l'onglet actif */
    saveActiveTab: (content: any) => Promise<void>;
    /** Marque un onglet comme modifié */
    markTabAsModified: (tabId: string) => void;
    /** Marque un onglet comme sauvegardé */
    markTabAsSaved: (tabId: string) => void;
    /** Ferme tous les onglets */
    closeAllTabs: () => void;
    /** Ouvre une vue depuis le repository */
    openViewFromRepository: (viewId: string, viewName: string, packageId: string, folderId?: string) => void;
}

/**
 * Store Zustand pour gérer les onglets de vues.
 * 
 * @example
 * const { tabs, activeTabId, addTab, saveActiveTab } = useTabsStore();
 */
export const useTabsStore = create<TabsStore>((set, get) => ({
    tabs: [],
    activeTabId: null,

    addTab: (tab) =>
        set((state) => {
            // Check if tab already exists
            const existingTab = state.tabs.find((t) => t.viewId === tab.viewId);
            if (existingTab) {
                return { activeTabId: existingTab.id };
            }

            return {
                tabs: [...state.tabs, tab],
                activeTabId: tab.id,
            };
        }),

    addTabWithPersistence: async (name, packageId, folderId) => {
        try {
            // Create view in database with Prisma format
            const viewData: any = {
                name,
                modelPackage: { connect: { id: packageId } },
                content: {}, // Empty content initially
            };

            // Only add folder if provided
            if (folderId) {
                viewData.folder = { connect: { id: folderId } };
            }

            console.log('Creating view with data:', viewData);
            const createdView = await viewsApi.create(viewData);

            const newTab: ViewTab = {
                id: `tab-${Date.now()}`,
                viewId: createdView.id,
                viewName: createdView.name,
                packageId: createdView.modelPackageId,
                folderId: createdView.folderId,
                isPersisted: true,
                isModified: false,
            };

            set((state) => ({
                tabs: [...state.tabs, newTab],
                activeTabId: newTab.id,
            }));

            // Trigger repository refresh to show the new view immediately
            const { useRepositoryStore } = await import('@/store/useRepositoryStore');
            useRepositoryStore.getState().triggerRefresh();

            return newTab;
        } catch (error) {
            console.error('Failed to create view:', error);
            throw error;
        }
    },

    removeTab: (tabId) =>
        set((state) => {
            const newTabs = state.tabs.filter((t) => t.id !== tabId);
            let newActiveTabId = state.activeTabId;

            // If we're closing the active tab, switch to another tab
            if (state.activeTabId === tabId) {
                if (newTabs.length > 0) {
                    const currentIndex = state.tabs.findIndex((t) => t.id === tabId);
                    const nextIndex = Math.min(currentIndex, newTabs.length - 1);
                    newActiveTabId = newTabs[nextIndex]?.id || null;
                } else {
                    newActiveTabId = null;
                }
            }

            return {
                tabs: newTabs,
                activeTabId: newActiveTabId,
            };
        }),

    setActiveTab: (tabId) =>
        set(() => ({
            activeTabId: tabId,
        })),

    updateTabName: async (tabId, newName) => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === tabId);

        if (tab && tab.isPersisted) {
            try {
                // Update in database
                await viewsApi.rename(tab.viewId, newName);

                // Update local state
                set((state) => ({
                    tabs: state.tabs.map((t) =>
                        t.id === tabId ? { ...t, viewName: newName } : t
                    ),
                }));

                // Trigger repository refresh
                const { useRepositoryStore } = await import('@/store/useRepositoryStore');
                useRepositoryStore.getState().triggerRefresh();
            } catch (error) {
                console.error('Failed to rename view:', error);
                throw error;
            }
        } else {
            // Just update local state for non-persisted tabs
            set((state) => ({
                tabs: state.tabs.map((t) =>
                    t.id === tabId ? { ...t, viewName: newName } : t
                ),
            }));
        }
    },

    updateTabFolder: async (tabId, folderId) => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === tabId);

        if (tab && tab.isPersisted) {
            try {
                // Update in database
                await viewsApi.moveToFolder(tab.viewId, folderId);

                // Update local state
                set((state) => ({
                    tabs: state.tabs.map((t) =>
                        t.id === tabId ? { ...t, folderId: folderId || undefined } : t
                    ),
                }));
            } catch (error) {
                console.error('Failed to move view:', error);
                throw error;
            }
        }
    },

    saveActiveTab: async (content) => {
        const state = get();
        const activeTab = state.tabs.find((t) => t.id === state.activeTabId);

        if (!activeTab) {
            throw new Error('No active tab to save');
        }

        if (!activeTab.isPersisted) {
            throw new Error('Cannot save non-persisted tab');
        }

        try {
            // Update view content in database
            await viewsApi.update(activeTab.viewId, { content });
            console.log('✓ View saved:', activeTab.viewName);
            
            // Mark tab as saved (not modified)
            set((state) => ({
                tabs: state.tabs.map((t) =>
                    t.id === activeTab.id ? { ...t, isModified: false } : t
                ),
            }));
        } catch (error) {
            console.error('Failed to save view:', error);
            throw error;
        }
    },

    markTabAsModified: (tabId) =>
        set((state) => ({
            tabs: state.tabs.map((t) =>
                t.id === tabId ? { ...t, isModified: true } : t
            ),
        })),

    markTabAsSaved: (tabId) =>
        set((state) => ({
            tabs: state.tabs.map((t) =>
                t.id === tabId ? { ...t, isModified: false } : t
            ),
        })),

    closeAllTabs: () =>
        set(() => ({
            tabs: [],
            activeTabId: null,
        })),

    openViewFromRepository: (viewId, viewName, packageId, folderId) => {
        const state = get();

        // Check if view is already open
        const existingTab = state.tabs.find((t) => t.viewId === viewId);
        if (existingTab) {
            set({ activeTabId: existingTab.id });
            return;
        }

        // Create new tab for existing view
        const newTab: ViewTab = {
            id: `tab-${Date.now()}`,
            viewId,
            viewName,
            packageId,
            folderId,
            isPersisted: true,
            isModified: false,
        };

        set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
        }));
    },
}));
