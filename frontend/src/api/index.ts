import api from './client';
import type { 
  Place, 
  Favorite, 
  SearchHistory, 
  PopularKeyword, 
  CacheEntry
} from '../types';

// Cache API
export const cacheAPI = {
  getSearch: (keyword: string) => 
    api.get<CacheEntry>(`/cache/search?keyword=${encodeURIComponent(keyword)}`),
  
  setSearch: (keyword: string, results: Place[], ttl?: number) =>
    api.post<{ message: string }>('/cache/search', { keyword, results, ttl }),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => 
    api.get<{ favorites: Favorite[]; count: number }>('/favorites'),
  
  toggle: (place: Partial<Favorite>) =>
    api.post<{ place_id: string; is_favorite: boolean; action: string }>('/favorites/check', place),
};

// History API
export const historyAPI = {
  getRecent: (limit = 20) =>
    api.get<{ history: SearchHistory[]; count: number }>(`/history?limit=${limit}`),
  
  getPopular: (limit = 10) =>
    api.get<{ keywords: PopularKeyword[]; count: number }>(`/history/popular?limit=${limit}`),
  
  clear: () =>
    api.delete<{ message: string }>('/history'),
};

// Directions API
export const directionsAPI = {
  getDirections: (origin: string, destination: string) =>
    api.get<unknown>(`/directions?origin=${origin}&destination=${destination}`),
};

export default {
  cache: cacheAPI,
  favorites: favoritesAPI,
  history: historyAPI,
  directions: directionsAPI,
};
