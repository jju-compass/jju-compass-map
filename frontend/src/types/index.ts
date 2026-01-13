// Place types (Kakao API response)
export interface Place {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  place_url: string;
  distance: string;
}

// Favorite place
export interface Favorite {
  id: number;
  user_id: string;
  place_id: string;
  place_name: string;
  address: string;
  road_address: string;
  lat: number;
  lng: number;
  phone: string;
  category: string;
  created_at: string;
}

// Search history
export interface SearchHistory {
  id: number;
  user_id: string;
  keyword: string;
  result_count: number;
  searched_at: string;
}

// Popular keyword
export interface PopularKeyword {
  keyword: string;
  count: number;
}

// Cache entry
export interface CacheEntry {
  cached: boolean;
  keyword: string;
  results?: Place[];
  cached_at?: string;
}

// Coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

// Route info
export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
}
