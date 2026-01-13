import { useEffect, useRef, useCallback, useState } from 'react';
import { useMapStore } from '@store/mapStore';
import { getCategoryEmoji } from '../../../utils/categoryEmoji';
import type { Place } from '../../../types';
import '../PlaceMarker/PlaceMarker.css';
import './PlaceMarkerCluster.css';

export interface PlaceMarkerClusterProps {
  places: Place[];
  selectedPlaceId?: string;
  onPlaceClick?: (place: Place) => void;
  minClusterSize?: number; // 클러스터링 최소 개수
}

interface ClusterGroup {
  id: string;
  places: Place[];
  center: { lat: number; lng: number };
}

// 두 좌표 사이의 픽셀 거리 계산
function getPixelDistance(
  map: kakao.maps.Map,
  pos1: { lat: number; lng: number },
  pos2: { lat: number; lng: number }
): number {
  const proj = (map as any).getProjection();
  const point1 = proj.containerPointFromCoords(
    new kakao.maps.LatLng(pos1.lat, pos1.lng)
  );
  const point2 = proj.containerPointFromCoords(
    new kakao.maps.LatLng(pos2.lat, pos2.lng)
  );
  
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 클러스터링 알고리즘
function clusterPlaces(
  map: kakao.maps.Map,
  places: Place[],
  clusterRadius: number,
  minClusterSize: number
): { clusters: ClusterGroup[]; singles: Place[] } {
  const clusters: ClusterGroup[] = [];
  const singles: Place[] = [];
  const processed = new Set<string>();

  for (const place of places) {
    if (processed.has(place.id)) continue;

    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    if (isNaN(lat) || isNaN(lng)) continue;

    // 이 장소와 가까운 다른 장소들 찾기
    const nearbyPlaces: Place[] = [place];
    
    for (const other of places) {
      if (other.id === place.id || processed.has(other.id)) continue;
      
      const otherLat = parseFloat(other.y);
      const otherLng = parseFloat(other.x);
      if (isNaN(otherLat) || isNaN(otherLng)) continue;

      const distance = getPixelDistance(
        map,
        { lat, lng },
        { lat: otherLat, lng: otherLng }
      );

      if (distance <= clusterRadius) {
        nearbyPlaces.push(other);
      }
    }

    if (nearbyPlaces.length >= minClusterSize) {
      // 클러스터 생성
      const centerLat = nearbyPlaces.reduce((sum, p) => sum + parseFloat(p.y), 0) / nearbyPlaces.length;
      const centerLng = nearbyPlaces.reduce((sum, p) => sum + parseFloat(p.x), 0) / nearbyPlaces.length;
      
      // 안정적인 클러스터 ID 생성: 포함된 장소 ID들을 정렬하여 연결
      const stableClusterId = nearbyPlaces.map(p => p.id).sort().join('_');
      
      clusters.push({
        id: `cluster-${stableClusterId}`,
        places: nearbyPlaces,
        center: { lat: centerLat, lng: centerLng },
      });
      
      nearbyPlaces.forEach(p => processed.add(p.id));
    } else {
      // 단일 마커로 표시
      singles.push(place);
      processed.add(place.id);
    }
  }

  return { clusters, singles };
}

export const PlaceMarkerCluster: React.FC<PlaceMarkerClusterProps> = ({
  places,
  selectedPlaceId,
  onPlaceClick,
  minClusterSize = 3,
}) => {
  const { map, zoom } = useMapStore();
  const overlaysRef = useRef<Map<string, kakao.maps.CustomOverlay>>(new Map());
  const [clusterData, setClusterData] = useState<{
    clusters: ClusterGroup[];
    singles: Place[];
  }>({ clusters: [], singles: [] });

  // 줌 레벨에 따른 클러스터 반경 계산
  const getClusterRadius = useCallback((zoomLevel: number): number => {
    // 줌 아웃할수록 (레벨 높을수록) 클러스터 반경 증가
    if (zoomLevel >= 7) return 80;
    if (zoomLevel >= 5) return 60;
    if (zoomLevel >= 3) return 40;
    return 30;
  }, []);

  // 클러스터링 업데이트
  const updateClusters = useCallback(() => {
    if (!map || places.length === 0) {
      setClusterData({ clusters: [], singles: [] });
      return;
    }

    const currentZoom = map.getLevel();
    const radius = getClusterRadius(currentZoom);
    const result = clusterPlaces(map, places, radius, minClusterSize);
    setClusterData(result);
  }, [map, places, minClusterSize, getClusterRadius]);

  // 맵 이벤트 리스너
  useEffect(() => {
    if (!map) return;

    updateClusters();

    const handleZoomChange = () => updateClusters();
    const handleDragEnd = () => updateClusters();

    kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChange);
    kakao.maps.event.addListener(map, 'dragend', handleDragEnd);

    return () => {
      kakao.maps.event.removeListener(map, 'zoom_changed', handleZoomChange);
      kakao.maps.event.removeListener(map, 'dragend', handleDragEnd);
    };
  }, [map, updateClusters]);

  // 줌 레벨에 따른 표시 모드
  const getDisplayMode = useCallback((zoomLevel: number): 'emoji-only' | 'with-name' | 'full' => {
    if (zoomLevel >= 6) return 'emoji-only';
    if (zoomLevel >= 4) return 'with-name';
    return 'full';
  }, []);

  // 단일 마커 HTML 생성
  const createSingleMarkerContent = useCallback((place: Place, index: number) => {
    const currentZoom = map?.getLevel() || 3;
    const displayMode = getDisplayMode(currentZoom);
    const emoji = getCategoryEmoji(place.category_name);
    const isSelected = place.id === selectedPlaceId;
    const shortCategory = place.category_name?.split('>').slice(1).join(' > ').trim() || '';

    const el = document.createElement('div');
    el.className = `place-marker place-marker-${displayMode}${isSelected ? ' place-marker-selected' : ''}`;
    el.style.animationDelay = `${index * 30}ms`;

    if (displayMode === 'emoji-only') {
      el.innerHTML = `
        <div class="place-marker-emoji-only">
          <span class="place-marker-emoji">${emoji}</span>
        </div>
      `;
    } else if (displayMode === 'with-name') {
      el.innerHTML = `
        <div class="place-marker-content">
          <span class="place-marker-emoji">${emoji}</span>
          <span class="place-marker-name">${place.place_name}</span>
        </div>
        <div class="place-marker-tail"></div>
      `;
    } else {
      el.innerHTML = `
        <div class="place-marker-content">
          <span class="place-marker-emoji">${emoji}</span>
          <div class="place-marker-info">
            <span class="place-marker-name">${place.place_name}</span>
            <span class="place-marker-category">${shortCategory}</span>
          </div>
        </div>
        <div class="place-marker-tail"></div>
      `;
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onPlaceClick?.(place);
    });

    return el;
  }, [map, selectedPlaceId, onPlaceClick, getDisplayMode]);

  // 클러스터 마커 HTML 생성
  const createClusterMarkerContent = useCallback((cluster: ClusterGroup) => {
    const el = document.createElement('div');
    el.className = 'place-marker-cluster';
    
    // 클러스터 내 대표 이모지 (첫 번째 장소의 이모지)
    const emoji = getCategoryEmoji(cluster.places[0]?.category_name || '');
    
    el.innerHTML = `
      <div class="place-marker-cluster-content">
        <span class="place-marker-cluster-emoji">${emoji}</span>
        <span class="place-marker-cluster-count">${cluster.places.length}</span>
      </div>
    `;

    // 클러스터 클릭 시 해당 영역으로 줌 인
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (map) {
        const bounds = new kakao.maps.LatLngBounds();
        cluster.places.forEach(place => {
          const lat = parseFloat(place.y);
          const lng = parseFloat(place.x);
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend(new kakao.maps.LatLng(lat, lng));
          }
        });
        map.setBounds(bounds, 50);
      }
    });

    return el;
  }, [map]);

  // 오버레이 렌더링 (차분 업데이트: 기존 마커 재사용, 새 마커만 추가, 불필요한 마커만 제거)
  useEffect(() => {
    if (!map) return;

    const newOverlayIds = new Set<string>();

    // 단일 마커 처리
    clusterData.singles.forEach((place, index) => {
      const lat = parseFloat(place.y);
      const lng = parseFloat(place.x);
      if (isNaN(lat) || isNaN(lng)) return;

      newOverlayIds.add(place.id);

      // 기존 오버레이가 없을 때만 새로 생성
      if (!overlaysRef.current.has(place.id)) {
        const content = createSingleMarkerContent(place, index);
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(lat, lng),
          content,
          yAnchor: 1.1,
          zIndex: place.id === selectedPlaceId ? 100 : 10,
        });
        
        overlay.setMap(map);
        overlaysRef.current.set(place.id, overlay);
      }
    });

    // 클러스터 마커 처리
    clusterData.clusters.forEach((cluster) => {
      newOverlayIds.add(cluster.id);

      // 기존 오버레이가 없을 때만 새로 생성
      if (!overlaysRef.current.has(cluster.id)) {
        const content = createClusterMarkerContent(cluster);
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(cluster.center.lat, cluster.center.lng),
          content,
          yAnchor: 0.5,
          zIndex: 50,
        });
        
        overlay.setMap(map);
        overlaysRef.current.set(cluster.id, overlay);
      }
    });

    // 더 이상 필요 없는 오버레이만 제거
    overlaysRef.current.forEach((overlay, id) => {
      if (!newOverlayIds.has(id)) {
        overlay.setMap(null);
        overlaysRef.current.delete(id);
      }
    });

  }, [map, clusterData, createSingleMarkerContent, createClusterMarkerContent]);

  // 컴포넌트 언마운트 시 모든 오버레이 정리
  useEffect(() => {
    return () => {
      overlaysRef.current.forEach(overlay => {
        overlay.setMap(null);
      });
      overlaysRef.current.clear();
    };
  }, []);

  return null;
};

export default PlaceMarkerCluster;
