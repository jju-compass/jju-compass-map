import { create } from 'zustand';
import type { Place, Coordinates, MapMarker } from '../types';

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
  clearSearchResults: () => void;

  // Selected place
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;

  // Markers
  markers: MapMarker[];
  setMarkers: (markers: MapMarker[]) => void;
  clearMarkers: () => void;

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

// Jeonju University coordinates (default center)
const JJU_CENTER: Coordinates = {
  lat: 35.8428,
  lng: 127.1353,
};

export const useMapStore = create<MapState>((set) => ({
  // Map
  map: null,
  setMap: (map) => set({ map }),

  // Center
  center: JJU_CENTER,
  setCenter: (center) => set({ center }),

  // Zoom
  zoom: 16,
  setZoom: (zoom) => set({ zoom }),

  // Search results
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  clearSearchResults: () => set({ searchResults: [], selectedPlace: null }),

  // Selected place
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),

  // Markers
  markers: [],
  setMarkers: (markers) => set({ markers }),
  clearMarkers: () => set({ markers: [] }),

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
