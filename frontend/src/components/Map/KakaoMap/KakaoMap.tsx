import React, { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '@store/mapStore';
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
  
  const { center, zoom, setMap, setCenter, setZoom } = useMapStore();

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
      const center = map.getCenter();
      const lat = center.getLat();
      const lng = center.getLng();
      setCenter({ lat, lng });
      onDragEnd?.(lat, lng);
    };

    // Zoom changed event
    const handleZoomChanged = () => {
      const level = map.getLevel();
      console.log('[DEBUG KakaoMap] zoom_changed event fired, level:', level);
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
  }, [onClick, onDragEnd, onZoomChanged, setCenter, setZoom]);

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
