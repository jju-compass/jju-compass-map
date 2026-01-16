import { useEffect, useRef, useCallback, useState } from 'react';
import { useMapStore } from '@store/mapStore';
import { getCategoryEmoji } from '../../../utils/categoryEmoji';
import { SoundEffects } from '../../../utils/soundEffects';
import type { Place } from '../../../types';
import './PlaceMarker.css';
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

// 겹침 그룹 (같은 위치에 있는 마커들)
interface OverlappingGroup {
  id: string;
  places: Place[];
  position: { lat: number; lng: number };
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
  minClusterSize: number,
  overlapRadius: number
): { clusters: ClusterGroup[]; singles: Place[]; overlappingGroups: OverlappingGroup[] } {
  const clusters: ClusterGroup[] = [];
  const singles: Place[] = [];
  const processed = new Set<string>();

  // 1차 클러스터링: 기존 로직
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
      
      clusters.push({
        id: `cluster-${place.id}`,
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

  // 2차 충돌 검사: singles 간 겹침 처리 (클러스터 반경 기준)
  const afterClusterSingles: Place[] = [];
  const singleProcessed = new Set<string>();

  for (const single of singles) {
    if (singleProcessed.has(single.id)) continue;

    const singleLat = parseFloat(single.y);
    const singleLng = parseFloat(single.x);
    if (isNaN(singleLat) || isNaN(singleLng)) {
      afterClusterSingles.push(single);
      singleProcessed.add(single.id);
      continue;
    }

    // 다른 singles와 거리 검사 (클러스터 반경)
    const nearbySingles = singles.filter(other => {
      if (singleProcessed.has(other.id) || other.id === single.id) return false;
      
      const otherLat = parseFloat(other.y);
      const otherLng = parseFloat(other.x);
      if (isNaN(otherLat) || isNaN(otherLng)) return false;

      const distance = getPixelDistance(
        map,
        { lat: singleLat, lng: singleLng },
        { lat: otherLat, lng: otherLng }
      );
      
      return distance <= clusterRadius;
    });

    if (nearbySingles.length >= 1) {
      // 가까운 singles가 있으면 클러스터로 묶음
      const allNearby = [single, ...nearbySingles];
      const centerLat = allNearby.reduce((sum, p) => sum + parseFloat(p.y), 0) / allNearby.length;
      const centerLng = allNearby.reduce((sum, p) => sum + parseFloat(p.x), 0) / allNearby.length;
      
      clusters.push({
        id: `cluster-single-${single.id}`,
        places: allNearby,
        center: { lat: centerLat, lng: centerLng },
      });
      
      allNearby.forEach(p => singleProcessed.add(p.id));
    } else {
      afterClusterSingles.push(single);
      singleProcessed.add(single.id);
    }
  }

  // 3차 겹침 감지: 시각적으로 겹치는 마커들을 overlappingGroups로 분류
  const overlappingGroups: OverlappingGroup[] = [];
  const finalSingles: Place[] = [];
  const overlapProcessed = new Set<string>();

  for (const single of afterClusterSingles) {
    if (overlapProcessed.has(single.id)) continue;

    const singleLat = parseFloat(single.y);
    const singleLng = parseFloat(single.x);
    if (isNaN(singleLat) || isNaN(singleLng)) {
      finalSingles.push(single);
      overlapProcessed.add(single.id);
      continue;
    }

    // 다른 singles와 거리 검사 (겹침 반경)
    const overlappingSingles = afterClusterSingles.filter(other => {
      if (overlapProcessed.has(other.id) || other.id === single.id) return false;
      
      const otherLat = parseFloat(other.y);
      const otherLng = parseFloat(other.x);
      if (isNaN(otherLat) || isNaN(otherLng)) return false;

      const distance = getPixelDistance(
        map,
        { lat: singleLat, lng: singleLng },
        { lat: otherLat, lng: otherLng }
      );
      
      return distance <= overlapRadius;
    });

    if (overlappingSingles.length >= 1) {
      // 겹치는 마커들을 overlappingGroup으로 묶음
      const allOverlapping = [single, ...overlappingSingles];
      
      overlappingGroups.push({
        id: `overlap-${single.id}`,
        places: allOverlapping,
        position: { lat: singleLat, lng: singleLng },
      });
      
      allOverlapping.forEach(p => overlapProcessed.add(p.id));
    } else {
      finalSingles.push(single);
      overlapProcessed.add(single.id);
    }
  }

  return { clusters, singles: finalSingles, overlappingGroups };
}

export const PlaceMarkerCluster: React.FC<PlaceMarkerClusterProps> = ({
  places,
  selectedPlaceId,
  onPlaceClick,
  minClusterSize = 3,
}) => {
  const { map, zoom } = useMapStore();
  const overlaysRef = useRef<Map<string, kakao.maps.CustomOverlay>>(new Map());
  const hideTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const activePopupRef = useRef<string | null>(null);
  const [clusterData, setClusterData] = useState<{
    clusters: ClusterGroup[];
    singles: Place[];
    overlappingGroups: OverlappingGroup[];
  }>({ clusters: [], singles: [], overlappingGroups: [] });

  // 줌 레벨에 따른 클러스터 반경 계산
  const getClusterRadius = useCallback((zoomLevel: number): number => {
    // 마커 크기 고려: full(~150px), with-name(~100px), emoji-only(32px)
    // 줌 아웃할수록 (레벨 높을수록) 클러스터 반경 증가
    if (zoomLevel >= 7) return 100;  // emoji-only → 충분
    if (zoomLevel >= 5) return 80;   // emoji-only → 충분
    if (zoomLevel >= 4) return 60;   // with-name → 적당히
    if (zoomLevel >= 3) return 40;   // with-name → 좁게
    if (zoomLevel >= 2) return 15;   // full → 매우 좁게
    return 0;                         // 줌 레벨 1: 클러스터링 비활성화
  }, []);

  // 줌 레벨에 따른 겹침 감지 반경 계산 (마커 크기 기준)
  const getOverlapRadius = useCallback((zoomLevel: number): number => {
    if (zoomLevel >= 4) return 16;   // emoji-only (32px의 50%)
    if (zoomLevel >= 2) return 50;   // with-name (~100px의 50%)
    return 75;                        // full (~150px의 50%)
  }, []);

  // 클러스터링 업데이트
  const updateClusters = useCallback(() => {
    if (!map || places.length === 0) {
      setClusterData({ clusters: [], singles: [], overlappingGroups: [] });
      return;
    }

    const currentZoom = map.getLevel();
    const clusterRadius = getClusterRadius(currentZoom);
    const overlapRadius = getOverlapRadius(currentZoom);
    const result = clusterPlaces(map, places, clusterRadius, minClusterSize, overlapRadius);
    setClusterData(result);
  }, [map, places, minClusterSize, getClusterRadius, getOverlapRadius]);

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
    // 더 일찍 축소하여 겹침 방지
    if (zoomLevel >= 4) return 'emoji-only';   // 6 → 4
    if (zoomLevel >= 2) return 'with-name';    // 4 → 2
    return 'full';  // 줌 레벨 1에서만 full
  }, []);

  // 팝업 표시/숨김 헬퍼
  const showPopup = useCallback((popup: HTMLElement, markerId: string) => {
    // 기존 타이머 취소
    const existingTimer = hideTimersRef.current.get(markerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      hideTimersRef.current.delete(markerId);
    }
    popup.classList.add('visible');
    activePopupRef.current = markerId;
  }, []);

  const hidePopup = useCallback((popup: HTMLElement, markerId: string, delay = 200) => {
    const timer = setTimeout(() => {
      popup.classList.remove('visible');
      if (activePopupRef.current === markerId) {
        activePopupRef.current = null;
      }
      hideTimersRef.current.delete(markerId);
    }, delay);
    hideTimersRef.current.set(markerId, timer);
  }, []);

  const cancelHidePopup = useCallback((markerId: string) => {
    const timer = hideTimersRef.current.get(markerId);
    if (timer) {
      clearTimeout(timer);
      hideTimersRef.current.delete(markerId);
    }
  }, []);

  // 팝업 리스트 HTML 생성
  const createPopupContent = useCallback((places: Place[], markerId: string, onClose: () => void) => {
    const popup = document.createElement('div');
    popup.className = 'place-marker-popup';
    
    // 헤더
    const header = document.createElement('div');
    header.className = 'place-marker-popup-header';
    header.innerHTML = `
      <span class="place-marker-popup-title">이 위치 (${places.length})</span>
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'place-marker-popup-close';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClose();
    });
    closeBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      onClose();
    }, { passive: false });
    header.appendChild(closeBtn);
    popup.appendChild(header);
    
    // 리스트
    const list = document.createElement('ul');
    list.className = 'place-marker-popup-list';
    
    places.forEach(place => {
      const emoji = getCategoryEmoji(place.category_name);
      const shortCategory = place.category_name?.split('>').slice(1).join(' > ').trim() || '';
      
      const item = document.createElement('li');
      item.className = 'place-marker-popup-item';
      item.innerHTML = `
        <span class="place-marker-popup-emoji">${emoji}</span>
        <div class="place-marker-popup-info">
          <span class="place-marker-popup-name">${place.place_name}</span>
          <span class="place-marker-popup-category">${shortCategory}</span>
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        SoundEffects.playClick();
        onPlaceClick?.(place);
        onClose();
      });
      
      item.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: false });
      
      list.appendChild(item);
    });
    
    popup.appendChild(list);

    // 팝업 호버 시 숨김 취소
    popup.addEventListener('mouseenter', () => {
      cancelHidePopup(markerId);
    });
    popup.addEventListener('mouseleave', () => {
      hidePopup(popup, markerId);
    });
    
    return popup;
  }, [onPlaceClick, cancelHidePopup, hidePopup]);

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

  // 겹침 그룹 마커 HTML 생성 (배지 + 팝업)
  const createOverlappingGroupContent = useCallback((group: OverlappingGroup, index: number) => {
    const currentZoom = map?.getLevel() || 3;
    const displayMode = getDisplayMode(currentZoom);
    const primaryPlace = group.places[0];
    const emoji = getCategoryEmoji(primaryPlace.category_name);
    const isSelected = group.places.some(p => p.id === selectedPlaceId);
    const shortCategory = primaryPlace.category_name?.split('>').slice(1).join(' > ').trim() || '';
    const hiddenCount = group.places.length - 1;

    const wrapper = document.createElement('div');
    wrapper.className = 'place-marker-wrapper';

    const el = document.createElement('div');
    el.className = `place-marker place-marker-${displayMode}${isSelected ? ' place-marker-selected' : ''} place-marker-has-popup`;
    el.style.animationDelay = `${index * 30}ms`;

    if (displayMode === 'emoji-only') {
      el.innerHTML = `
        <div class="place-marker-emoji-only">
          <span class="place-marker-emoji">${emoji}</span>
        </div>
        <span class="place-marker-badge">+${hiddenCount}</span>
      `;
    } else if (displayMode === 'with-name') {
      el.innerHTML = `
        <div class="place-marker-content">
          <span class="place-marker-emoji">${emoji}</span>
          <span class="place-marker-name">${primaryPlace.place_name}</span>
        </div>
        <div class="place-marker-tail"></div>
        <span class="place-marker-badge">+${hiddenCount}</span>
      `;
    } else {
      el.innerHTML = `
        <div class="place-marker-content">
          <span class="place-marker-emoji">${emoji}</span>
          <div class="place-marker-info">
            <span class="place-marker-name">${primaryPlace.place_name}</span>
            <span class="place-marker-category">${shortCategory}</span>
          </div>
        </div>
        <div class="place-marker-tail"></div>
        <span class="place-marker-badge">+${hiddenCount}</span>
      `;
    }

    wrapper.appendChild(el);

    // 팝업 생성
    const popup = createPopupContent(group.places, group.id, () => {
      popup.classList.remove('visible');
      activePopupRef.current = null;
    });
    wrapper.appendChild(popup);

    // 마우스 이벤트
    el.addEventListener('mouseenter', () => {
      showPopup(popup, group.id);
    });
    el.addEventListener('mouseleave', () => {
      hidePopup(popup, group.id);
    });

    // 터치 이벤트
    el.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      if (popup.classList.contains('visible')) {
        popup.classList.remove('visible');
        activePopupRef.current = null;
      } else {
        showPopup(popup, group.id);
      }
    }, { passive: false });

    // 마커 클릭 시 첫 번째 장소 선택
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      // 팝업이 표시 중이면 클릭 무시 (팝업에서 선택하도록)
      if (!popup.classList.contains('visible')) {
        onPlaceClick?.(primaryPlace);
      }
    });

    return wrapper;
  }, [map, selectedPlaceId, onPlaceClick, getDisplayMode, createPopupContent, showPopup, hidePopup]);

  // 클러스터 마커 HTML 생성 (팝업 포함)
  const createClusterMarkerContent = useCallback((cluster: ClusterGroup) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'place-marker-wrapper';

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

    wrapper.appendChild(el);

    // 팝업 생성
    const popup = createPopupContent(cluster.places, cluster.id, () => {
      popup.classList.remove('visible');
      activePopupRef.current = null;
    });
    wrapper.appendChild(popup);

    // 마우스 이벤트
    el.addEventListener('mouseenter', () => {
      showPopup(popup, cluster.id);
    });
    el.addEventListener('mouseleave', () => {
      hidePopup(popup, cluster.id);
    });

    // 터치 이벤트
    el.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      if (popup.classList.contains('visible')) {
        popup.classList.remove('visible');
        activePopupRef.current = null;
      } else {
        showPopup(popup, cluster.id);
      }
    }, { passive: false });

    // 클러스터 클릭 시 해당 영역으로 줌 인
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      // 팝업이 표시 중이면 클릭 무시
      if (!popup.classList.contains('visible')) {
        SoundEffects.playClick();
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
      }
    });

    return wrapper;
  }, [map, createPopupContent, showPopup, hidePopup]);

  // 오버레이 렌더링
  useEffect(() => {
    if (!map) return;

    // 기존 오버레이 모두 제거
    overlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    overlaysRef.current.clear();

    // 타이머 정리
    hideTimersRef.current.forEach(timer => clearTimeout(timer));
    hideTimersRef.current.clear();
    activePopupRef.current = null;

    // 단일 마커 생성
    clusterData.singles.forEach((place, index) => {
      const lat = parseFloat(place.y);
      const lng = parseFloat(place.x);
      if (isNaN(lat) || isNaN(lng)) return;

      const content = createSingleMarkerContent(place, index);
      const baseZIndex = place.id === selectedPlaceId ? 100 : (10 + index);
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(lat, lng),
        content,
        yAnchor: 1.1,
        zIndex: baseZIndex,
      });

      // 마우스 호버 시 맨 앞으로 표시
      content.addEventListener('mouseenter', () => {
        overlay.setZIndex(200);
      });
      content.addEventListener('mouseleave', () => {
        overlay.setZIndex(baseZIndex);
      });

      // 터치 디바이스 대응 (탭 시 맨 앞으로)
      content.addEventListener('touchstart', () => {
        overlay.setZIndex(200);
      }, { passive: true });
      
      overlay.setMap(map);
      overlaysRef.current.set(place.id, overlay);
    });

    // 겹침 그룹 마커 생성
    clusterData.overlappingGroups.forEach((group, index) => {
      const content = createOverlappingGroupContent(group, index);
      const baseZIndex = group.places.some(p => p.id === selectedPlaceId) ? 100 : (20 + index);
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(group.position.lat, group.position.lng),
        content,
        yAnchor: 1.1,
        zIndex: baseZIndex,
      });

      // 마우스 호버 시 맨 앞으로 표시
      content.addEventListener('mouseenter', () => {
        overlay.setZIndex(250);
      });
      content.addEventListener('mouseleave', () => {
        // 팝업이 열려있으면 zIndex 유지
        if (activePopupRef.current !== group.id) {
          overlay.setZIndex(baseZIndex);
        }
      });
      
      overlay.setMap(map);
      overlaysRef.current.set(group.id, overlay);
    });

    // 클러스터 마커 생성
    clusterData.clusters.forEach((cluster, index) => {
      const content = createClusterMarkerContent(cluster);
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(cluster.center.lat, cluster.center.lng),
        content,
        yAnchor: 0.5,
        zIndex: 50 + index,
      });

      // 마우스 호버 시 맨 앞으로 표시
      content.addEventListener('mouseenter', () => {
        overlay.setZIndex(250);
      });
      content.addEventListener('mouseleave', () => {
        if (activePopupRef.current !== cluster.id) {
          overlay.setZIndex(50 + index);
        }
      });
      
      overlay.setMap(map);
      overlaysRef.current.set(cluster.id, overlay);
    });

    return () => {
      overlaysRef.current.forEach(overlay => {
        overlay.setMap(null);
      });
      overlaysRef.current.clear();
      hideTimersRef.current.forEach(timer => clearTimeout(timer));
      hideTimersRef.current.clear();
    };
  }, [map, clusterData, selectedPlaceId, createSingleMarkerContent, createOverlappingGroupContent, createClusterMarkerContent]);

  return null;
};

export default PlaceMarkerCluster;
