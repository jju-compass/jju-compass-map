import api from './client';
import type { 
  Place, 
  Favorite, 
  SearchHistory, 
  PopularKeyword, 
  CacheEntry, 
  CacheStats,
  APIUsage 
} from '../types';

// Cache API
export const cacheAPI = {
  getSearch: (keyword: string) => 
    api.get<CacheEntry>(`/cache/search?keyword=${encodeURIComponent(keyword)}`),
  
  setSearch: (keyword: string, results: Place[], ttl?: number) =>
    api.post<{ message: string }>('/cache/search', { keyword, results, ttl }),
  
  getStats: () => 
    api.get<CacheStats>('/cache/stats'),
  
  deleteExpired: () => 
    api.delete<{ deleted: number; message: string }>('/cache'),
  
  deleteByKeyword: (keyword: string) =>
    api.delete<{ message: string }>(`/cache?keyword=${encodeURIComponent(keyword)}`),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => 
    api.get<{ favorites: Favorite[]; count: number }>('/favorites'),
  
  add: (place: Omit<Favorite, 'id' | 'user_id' | 'created_at'>) =>
    api.post<Favorite>('/favorites', place),
  
  remove: (placeId: string) =>
    api.delete<{ message: string }>(`/favorites?place_id=${placeId}`),
  
  check: (placeId: string) =>
    api.get<{ place_id: string; is_favorite: boolean }>(`/favorites/check?place_id=${placeId}`),
  
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
  
  getUsage: () =>
    api.get<APIUsage>('/directions/usage'),
};

export default {
  cache: cacheAPI,
  favorites: favoritesAPI,
  history: historyAPI,
  directions: directionsAPI,
};
