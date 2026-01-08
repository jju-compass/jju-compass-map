import { create } from 'zustand';
import type { Favorite, SearchHistory, PopularKeyword, UserSettings } from '../types';

interface UserState {
  // Favorites
  favorites: Favorite[];
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (placeId: string) => void;
  isFavorite: (placeId: string) => boolean;

  // Search history
  history: SearchHistory[];
  setHistory: (history: SearchHistory[]) => void;
  clearHistory: () => void;

  // Popular keywords
  popularKeywords: PopularKeyword[];
  setPopularKeywords: (keywords: PopularKeyword[]) => void;

  // Home location
  homeSettings: UserSettings | null;
  setHomeSettings: (settings: UserSettings | null) => void;

  // Search keyword
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;

  // UI state
  activePanel: 'search' | 'favorites' | 'history' | 'settings' | null;
  setActivePanel: (panel: 'search' | 'favorites' | 'history' | 'settings' | null) => void;

  // Sidebar open state
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Favorites
  favorites: [],
  setFavorites: (favorites) => set({ favorites }),
  addFavorite: (favorite) => set((state) => ({ 
    favorites: [favorite, ...state.favorites] 
  })),
  removeFavorite: (placeId) => set((state) => ({
    favorites: state.favorites.filter((f) => f.place_id !== placeId)
  })),
  isFavorite: (placeId) => get().favorites.some((f) => f.place_id === placeId),

  // History
  history: [],
  setHistory: (history) => set({ history }),
  clearHistory: () => set({ history: [] }),

  // Popular keywords
  popularKeywords: [],
  setPopularKeywords: (keywords) => set({ popularKeywords: keywords }),

  // Home
  homeSettings: null,
  setHomeSettings: (settings) => set({ homeSettings: settings }),

  // Search keyword
  searchKeyword: '',
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  // Active panel
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),

  // Sidebar
  isSidebarOpen: true,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

export default useUserStore;
