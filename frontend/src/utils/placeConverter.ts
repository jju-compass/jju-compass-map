import type { Place, Favorite } from '../types';

/**
 * Favorite 객체를 Place 객체로 변환합니다.
 * PlaceMarkerCluster 등 Place 타입을 요구하는 컴포넌트에서 사용합니다.
 */
export function convertFavoriteToPlace(favorite: Favorite): Place {
  return {
    id: favorite.place_id,
    place_name: favorite.place_name,
    category_name: favorite.category || '',
    category_group_code: '',
    category_group_name: '',
    phone: favorite.phone || '',
    address_name: favorite.address || '',
    road_address_name: favorite.road_address || '',
    x: String(favorite.lng),
    y: String(favorite.lat),
    place_url: '',
    distance: '',
  };
}

/**
 * Favorite 배열을 Place 배열로 변환합니다.
 */
export function convertFavoritesToPlaces(favorites: Favorite[]): Place[] {
  return favorites.map(convertFavoriteToPlace);
}
