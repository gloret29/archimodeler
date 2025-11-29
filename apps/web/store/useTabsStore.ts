import { create } from 'zustand';
import { viewsApi, CreateViewDto } from '@/lib/api/views';

export interface ViewTab {
    id: string;
    viewId: string;
    viewName: string;
    packageId: string;
    folderId?: string;
    isPersisted: boolean; // Whether the view exists in the database
    isModified: boolean; // Whether the view has been modified since last save
}

interface TabsStore {
    tabs: ViewTab[];
    activeTabId: string | null;

    // Actions
    addTab: (tab: ViewTab) => void;
    addTabWithPersistence: (name: string, packageId: string, folderId?: string) => Promise<ViewTab>;
    removeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
    updateTabName: (tabId: string, newName: string) => Promise<void>;
    updateTabFolder: (tabId: string, folderId: string | null) => Promise<void>;
    saveActiveTab: (content: any) => Promise<void>;
    markTabAsModified: (tabId: string) => void;
    markTabAsSaved: (tabId: string) => void;
    closeAllTabs: () => void;
    openViewFromRepository: (viewId: string, viewName: string, packageId: string, folderId?: string) => void;
}

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
