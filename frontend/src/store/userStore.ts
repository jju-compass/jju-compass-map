import { create } from 'zustand';
import type { Favorite, SearchHistory, PopularKeyword } from '../types';

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
}));

export default useUserStore;
