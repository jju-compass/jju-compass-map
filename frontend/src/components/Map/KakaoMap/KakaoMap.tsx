import React, { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '@store/mapStore';
import { mapConfig } from '../../../constants/categories';
import { calculateDistance } from '../../../utils/distance';
import { toast } from '../../../store/toastStore';
import './KakaoMap.css';

export interface KakaoMapProps {
  className?: string;
  onMapReady?: (map: kakao.maps.Map) => void;
  onClick?: (lat: number, lng: number) => void;
  onDragEnd?: (lat: number, lng: number) => void;
  onZoomChanged?: (level: number) => void;
}

export const KakaoMap: React.FC<KakaoMapProps> = ({
  className = '',
  onMapReady,
  onClick,
  onDragEnd,
  onZoomChanged,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  
  const { center, zoom, setMap, setCenter, setZoom } = useMapStore();

  // 토스트 중복 방지 (2초 간격)
  const showBoundaryToast = useCallback(() => {
    const now = Date.now();
    if (now - lastToastTimeRef.current > 2000) {
      lastToastTimeRef.current = now;
      toast.info('전주대학교 캠퍼스 범위를 벗어났습니다');
    }
  }, []);

  // 좌표가 허용 범위 내인지 확인하고, 벗어나면 경계 좌표 반환
  const clampToAllowedBounds = useCallback((lat: number, lng: number): { lat: number; lng: number; clamped: boolean } => {
    const distance = calculateDistance(
      mapConfig.center.lat,
      mapConfig.center.lng,
      lat,
      lng
    );

    if (distance <= mapConfig.maxDistanceFromCenter) {
      return { lat, lng, clamped: false };
    }

    // 범위를 벗어난 경우: 중심에서 해당 방향으로 최대 거리까지의 좌표 계산
    const ratio = mapConfig.maxDistanceFromCenter / distance;
    const clampedLat = mapConfig.center.lat + (lat - mapConfig.center.lat) * ratio;
    const clampedLng = mapConfig.center.lng + (lng - mapConfig.center.lng) * ratio;

    return { lat: clampedLat, lng: clampedLng, clamped: true };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Check if Kakao Maps SDK is loaded
    if (typeof kakao === 'undefined' || !kakao.maps) {
      console.error('Kakao Maps SDK not loaded');
      return;
    }

    const options: kakao.maps.MapOptions = {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: zoom,
    };

    const map = new kakao.maps.Map(containerRef.current, options);
    mapRef.current = map;
    setMap(map);

    // 줌 레벨 제한 설정
    map.setMinLevel(mapConfig.minZoomLevel);
    map.setMaxLevel(mapConfig.maxZoomLevel);

    // Map ready callback
    onMapReady?.(map);

    return () => {
      mapRef.current = null;
      setMap(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register event listeners
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Click event
    const handleClick = (mouseEvent: unknown) => {
      const event = mouseEvent as { latLng: kakao.maps.LatLng };
      const lat = event.latLng.getLat();
      const lng = event.latLng.getLng();
      onClick?.(lat, lng);
    };

    // Drag end event
    const handleDragEnd = () => {
      const centerPos = map.getCenter();
      const lat = centerPos.getLat();
      const lng = centerPos.getLng();
      
      // 범위 체크 및 클램핑
      const { lat: clampedLat, lng: clampedLng, clamped } = clampToAllowedBounds(lat, lng);
      
      if (clamped) {
        // 범위를 벗어난 경우: 경계로 이동하고 토스트 표시
        const clampedLatLng = new kakao.maps.LatLng(clampedLat, clampedLng);
        map.setCenter(clampedLatLng);
        showBoundaryToast();
        setCenter({ lat: clampedLat, lng: clampedLng });
        onDragEnd?.(clampedLat, clampedLng);
      } else {
        setCenter({ lat, lng });
        onDragEnd?.(lat, lng);
      }
    };

    // Zoom changed event
    const handleZoomChanged = () => {
      const level = map.getLevel();
      setZoom(level);
      onZoomChanged?.(level);
    };

    kakao.maps.event.addListener(map, 'click', handleClick);
    kakao.maps.event.addListener(map, 'dragend', handleDragEnd);
    kakao.maps.event.addListener(map, 'zoom_changed', handleZoomChanged);

    return () => {
      kakao.maps.event.removeListener(map, 'click', handleClick);
      kakao.maps.event.removeListener(map, 'dragend', handleDragEnd);
      kakao.maps.event.removeListener(map, 'zoom_changed', handleZoomChanged);
    };
  }, [onClick, onDragEnd, onZoomChanged, setCenter, setZoom, clampToAllowedBounds, showBoundaryToast]);

  // Sync center changes from store
  const panTo = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    
    const moveLatLng = new kakao.maps.LatLng(lat, lng);
    map.panTo(moveLatLng);
  }, []);

  // Sync zoom changes from store
  const setLevel = useCallback((level: number, animate = true) => {
    const map = mapRef.current;
    if (!map) return;
    
    map.setLevel(level, { animate });
  }, []);

  // Expose methods via ref-like pattern through store
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Re-layout when container size changes
    const resizeObserver = new ResizeObserver(() => {
      map.relayout();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const classes = ['kakao-map', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div ref={containerRef} className="kakao-map-container" />
    </div>
  );
};

export default KakaoMap;
