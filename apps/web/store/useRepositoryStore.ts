import { create } from 'zustand';

interface RepositoryStore {
    refreshTrigger: number;
    triggerRefresh: () => void;
}

export const useRepositoryStore = create<RepositoryStore>((set) => ({
    refreshTrigger: 0,
    triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
