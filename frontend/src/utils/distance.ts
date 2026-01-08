import type { Place } from '../types';
import { mapConfig } from '../constants/categories';

/**
 * 두 좌표 사이의 거리 계산 (Haversine formula)
 * @returns 거리 (미터)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 지구 반경 (미터)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * 거리 포맷팅 (m/km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 검색 결과에 거리 정보 추가
 */
export function addDistanceToPlaces(
  places: Place[],
  center?: { lat: number; lng: number }
): (Place & { _distance?: number })[] {
  const centerLat = center?.lat ?? mapConfig.center.lat;
  const centerLng = center?.lng ?? mapConfig.center.lng;

  return places.map((place) => {
    const placeLat = parseFloat(place.y);
    const placeLng = parseFloat(place.x);
    const distance = calculateDistance(centerLat, centerLng, placeLat, placeLng);
    return { ...place, _distance: distance };
  });
}

export type SortType = 'distance' | 'name';

/**
 * 검색 결과 정렬
 */
export function sortPlaces(
  places: (Place & { _distance?: number })[],
  sortBy: SortType
): (Place & { _distance?: number })[] {
  const sorted = [...places];

  if (sortBy === 'name') {
    // 이름순 (가나다순)
    sorted.sort((a, b) => {
      const nameA = a.place_name || '';
      const nameB = b.place_name || '';
      return nameA.localeCompare(nameB, 'ko');
    });
  } else {
    // 거리순 (기본값)
    sorted.sort((a, b) => {
      const distA = a._distance ?? Infinity;
      const distB = b._distance ?? Infinity;
      return distA - distB;
    });
  }

  return sorted;
}
