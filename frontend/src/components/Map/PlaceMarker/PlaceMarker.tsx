import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapStore } from '@store/mapStore';
import { getCategoryEmoji, getShortCategory } from '../../../utils/categoryEmoji';
import type { Place } from '../../../types';
import './PlaceMarker.css';

export interface PlaceMarkerProps {
  place: Place;
  isSelected?: boolean;
  onClick?: (place: Place) => void;
  index?: number; // 애니메이션 딜레이용
}

// 줌 레벨별 표시 모드
type DisplayMode = 'emoji-only' | 'with-name' | 'full';

function getDisplayMode(zoomLevel: number): DisplayMode {
  if (zoomLevel >= 6) return 'emoji-only';      // 멀리 (레벨 높을수록 멀리)
  if (zoomLevel >= 4) return 'with-name';       // 중간
  return 'full';                                  // 가까이
}

export const PlaceMarker: React.FC<PlaceMarkerProps> = ({
  place,
  isSelected = false,
  onClick,
  index = 0,
}) => {
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  // 선택적 구독 - zoom 변경 시 리렌더링 방지 (zoom은 사용하지 않음)
  const map = useMapStore((state) => state.map);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('full');

  // 좌표 파싱
  const lat = parseFloat(place.y);
  const lng = parseFloat(place.x);

  // 이모지 및 카테고리 정보
  const emoji = getCategoryEmoji(place.category_name);
  const shortCategory = getShortCategory(place.category_name);

  // 줌 레벨 변경 감지
  useEffect(() => {
    if (!map) return;

    const handleZoomChange = () => {
      const currentZoom = map.getLevel();
      setDisplayMode(getDisplayMode(currentZoom));
    };

    // 초기 설정
    handleZoomChange();

    // 줌 변경 이벤트 리스너
    kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChange);

    return () => {
      kakao.maps.event.removeListener(map, 'zoom_changed', handleZoomChange);
    };
  }, [map]);

  // 마커 HTML 생성
  const createMarkerContent = useCallback(() => {
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

    // 클릭 이벤트
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick?.(place);
    });

    return el;
  }, [displayMode, isSelected, emoji, place, shortCategory, onClick, index]);

  // 마커 생성 및 업데이트
  useEffect(() => {
    if (!map || isNaN(lat) || isNaN(lng)) return;

    const position = new kakao.maps.LatLng(lat, lng);
    const content = createMarkerContent();
    elementRef.current = content;

    if (overlayRef.current) {
      // 기존 오버레이 업데이트
      overlayRef.current.setContent(content);
      overlayRef.current.setPosition(position);
    } else {
      // 새 오버레이 생성
      overlayRef.current = new kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1.1, // 꼬리 부분이 정확한 위치를 가리키도록
        zIndex: isSelected ? 100 : 10,
      });
      overlayRef.current.setMap(map);
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, lat, lng, createMarkerContent, isSelected]);

  // 선택 상태 변경 시 zIndex 업데이트
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setZIndex(isSelected ? 100 : 10);
    }
  }, [isSelected]);

  return null;
};

export default PlaceMarker;
