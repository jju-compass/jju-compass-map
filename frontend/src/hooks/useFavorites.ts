import { useCallback, useEffect } from 'react';
import { useUserStore } from '../store';
import { favoritesAPI } from '../api';
import type { Place, Favorite } from '../types';

export function useFavorites() {
  const { 
    favorites, 
    setFavorites, 
    addFavorite, 
    removeFavorite,
    isFavorite 
  } = useUserStore();

  // Load favorites on mount
  const loadFavorites = useCallback(async () => {
    try {
      const response = await favoritesAPI.getAll();
      setFavorites(response.favorites || []);
    } catch (error) {
      console.warn('Failed to load favorites:', error);
      setFavorites([]);
    }
  }, [setFavorites]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (place: Place) => {
    try {
      const result = await favoritesAPI.toggle({
        place_id: place.id,
        place_name: place.place_name,
        address: place.address_name,
        road_address: place.road_address_name,
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
        phone: place.phone,
        category: place.category_name,
      });

      if (result.action === 'added') {
        // Reload to get full favorite data
        await loadFavorites();
      } else {
        removeFavorite(place.id);
      }

      return result.is_favorite;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }, [loadFavorites, removeFavorite]);

  // Check if place is favorite
  const checkFavorite = useCallback((placeId: string) => {
    return isFavorite(placeId);
  }, [isFavorite]);

  return {
    favorites,
    loadFavorites,
    toggleFavorite,
    checkFavorite,
  };
}

export default useFavorites;
