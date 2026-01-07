import React, { useState } from 'react';
import { useMapStore } from '@store/mapStore';
import { useGeolocation } from '@hooks/useGeolocation';
import { Icon } from '@components/common';
import './MapControls.css';

export interface MapControlsProps {
  className?: string;
  showZoom?: boolean;
  showMyLocation?: boolean;
  showHome?: boolean;
  onHomeClick?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  className = '',
  showZoom = true,
  showMyLocation = true,
  showHome = false,
  onHomeClick,
}) => {
  const { map, zoom, setZoom, setCenter, setCurrentLocation } = useMapStore();
  const { getCurrentLocation } = useGeolocation();
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  const handleZoomIn = () => {
    if (!map) return;
    const newLevel = Math.max(1, zoom - 1);
    map.setLevel(newLevel, { animate: true });
    setZoom(newLevel);
  };

  const handleZoomOut = () => {
    if (!map) return;
    const newLevel = Math.min(14, zoom + 1);
    map.setLevel(newLevel, { animate: true });
    setZoom(newLevel);
  };

  const handleMyLocation = async () => {
    if (!map) return;
    
    setIsGeoLoading(true);
    try {
      const position = await getCurrentLocation();
      const { lat, lng } = position;
      
      setCurrentLocation({ lat, lng });
      setCenter({ lat, lng });
      
      const moveLatLng = new kakao.maps.LatLng(lat, lng);
      map.panTo(moveLatLng);
    } catch (error) {
      console.error('Failed to get current location:', error);
      alert('현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
    } finally {
      setIsGeoLoading(false);
    }
  };

  const handleHome = () => {
    if (onHomeClick) {
      onHomeClick();
    }
  };

  const classes = ['map-controls', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {showZoom && (
        <div className="map-controls-group">
          <button
            className="map-control-btn"
            onClick={handleZoomIn}
            aria-label="확대"
            title="확대"
          >
            <Icon name="plus" size="sm" />
          </button>
          <button
            className="map-control-btn"
            onClick={handleZoomOut}
            aria-label="축소"
            title="축소"
          >
            <Icon name="minus" size="sm" />
          </button>
        </div>
      )}
      
      {showMyLocation && (
        <div className="map-controls-group">
          <button
            className={`map-control-btn ${isGeoLoading ? 'loading' : ''}`}
            onClick={handleMyLocation}
            disabled={isGeoLoading}
            aria-label="내 위치"
            title="내 위치로 이동"
          >
            <Icon name="my-location" size="sm" />
          </button>
        </div>
      )}

      {showHome && (
        <div className="map-controls-group">
          <button
            className="map-control-btn"
            onClick={handleHome}
            aria-label="홈 위치"
            title="홈 위치로 이동"
          >
            <Icon name="home" size="sm" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MapControls;
