import { create } from 'zustand';
import type { Place, Coordinates } from '../types';

interface MapState {
  // Map instance
  map: kakao.maps.Map | null;
  setMap: (map: kakao.maps.Map | null) => void;

  // Current center
  center: Coordinates;
  setCenter: (center: Coordinates) => void;

  // Zoom level
  zoom: number;
  setZoom: (zoom: number) => void;

  // Search results
  searchResults: Place[];
  setSearchResults: (results: Place[]) => void;

  // Selected place
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error
  error: string | null;
  setError: (error: string | null) => void;

  // Current location
  currentLocation: Coordinates | null;
  setCurrentLocation: (location: Coordinates | null) => void;
}

// 전주대학교 정문 좌표 (기본 중심)
const JJU_CENTER: Coordinates = {
  lat: 35.814445811028584,
  lng: 127.09236571436321,
};

export const useMapStore = create<MapState>((set) => ({
  // Map
  map: null,
  setMap: (map) => set({ map }),

  // Center
  center: JJU_CENTER,
  setCenter: (center) => set({ center }),

  // Zoom (카카오맵: 1=가장 확대, 14=가장 축소, 4=약 500m 반경)
  zoom: 4,
  setZoom: (zoom) => set({ zoom }),

  // Search results
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),

  // Selected place
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Error
  error: null,
  setError: (error) => set({ error }),

  // Current location
  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),
}));

export default useMapStore;
