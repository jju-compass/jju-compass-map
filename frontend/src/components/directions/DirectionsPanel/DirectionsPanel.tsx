import React, { useState } from 'react';
import { Button, Icon, Input, Loading } from '@components/common';
import type { Place, Coordinates, RouteInfo } from '../../../types';
import './DirectionsPanel.css';

export type TransportMode = 'walking' | 'car' | 'transit';

export interface DirectionsLocation {
  name: string;
  coordinates: Coordinates;
  place?: Place;
}

export interface DirectionsPanelProps {
  origin?: DirectionsLocation | null;
  destination?: DirectionsLocation | null;
  routeInfo?: RouteInfo | null;
  isLoading?: boolean;
  error?: string | null;
  onOriginChange?: (location: DirectionsLocation | null) => void;
  onDestinationChange?: (location: DirectionsLocation | null) => void;
  onSearch?: (mode: TransportMode) => void;
  onSwap?: () => void;
  onUseCurrentLocation?: () => void;
  onClose?: () => void;
  className?: string;
}

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  origin,
  destination,
  routeInfo,
  isLoading = false,
  error,
  onOriginChange,
  onDestinationChange,
  onSearch,
  onSwap,
  onUseCurrentLocation,
  onClose,
  className = '',
}) => {
  const [transportMode, setTransportMode] = useState<TransportMode>('walking');

  const handleSearch = () => {
    if (origin && destination && onSearch) {
      onSearch(transportMode);
    }
  };

  const handleSwap = () => {
    onSwap?.();
  };

  const canSearch = origin && destination && !isLoading;

  const classes = ['directions-panel', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Header */}
      <div className="directions-panel-header">
        <h2 className="directions-panel-title">
          <Icon name="directions" size="md" />
          길찾기
        </h2>
        {onClose && (
          <button className="directions-panel-close" onClick={onClose} aria-label="닫기">
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>

      {/* Location Inputs */}
      <div className="directions-panel-locations">
        <div className="directions-location-row">
          <div className="directions-location-marker origin" />
          <div className="directions-location-input">
            <input
              type="text"
              placeholder="출발지 입력"
              value={origin?.name || ''}
              readOnly
              className="directions-input"
            />
            {onUseCurrentLocation && !origin && (
              <button
                className="directions-current-btn"
                onClick={onUseCurrentLocation}
                title="현재 위치 사용"
              >
                <Icon name="my-location" size="sm" />
              </button>
            )}
            {origin && (
              <button
                className="directions-clear-btn"
                onClick={() => onOriginChange?.(null)}
                title="지우기"
              >
                <Icon name="close" size="sm" />
              </button>
            )}
          </div>
        </div>

        <button className="directions-swap-btn" onClick={handleSwap} title="출발지/도착지 바꾸기">
          <Icon name="chevron-up" size="sm" />
          <Icon name="chevron-down" size="sm" />
        </button>

        <div className="directions-location-row">
          <div className="directions-location-marker destination" />
          <div className="directions-location-input">
            <input
              type="text"
              placeholder="도착지 입력"
              value={destination?.name || ''}
              readOnly
              className="directions-input"
            />
            {destination && (
              <button
                className="directions-clear-btn"
                onClick={() => onDestinationChange?.(null)}
                title="지우기"
              >
                <Icon name="close" size="sm" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transport Mode */}
      <div className="directions-panel-modes">
        <button
          className={`directions-mode-btn ${transportMode === 'walking' ? 'active' : ''}`}
          onClick={() => setTransportMode('walking')}
        >
          <Icon name="walking" size="md" />
          <span>도보</span>
        </button>
        <button
          className={`directions-mode-btn ${transportMode === 'car' ? 'active' : ''}`}
          onClick={() => setTransportMode('car')}
        >
          <Icon name="car" size="md" />
          <span>자동차</span>
        </button>
        <button
          className={`directions-mode-btn ${transportMode === 'transit' ? 'active' : ''}`}
          onClick={() => setTransportMode('transit')}
        >
          <Icon name="transit" size="md" />
          <span>대중교통</span>
        </button>
      </div>

      {/* Search Button */}
      <div className="directions-panel-actions">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSearch}
          disabled={!canSearch}
          loading={isLoading}
        >
          경로 검색
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="directions-panel-error">
          <Icon name="info" size="sm" />
          <span>{error}</span>
        </div>
      )}

      {/* Route Info Summary */}
      {routeInfo && !isLoading && (
        <div className="directions-panel-summary">
          <div className="directions-summary-item">
            <Icon name="clock" size="sm" />
            <span>{formatDuration(routeInfo.duration)}</span>
          </div>
          <div className="directions-summary-item">
            <Icon name="location" size="sm" />
            <span>{formatDistance(routeInfo.distance)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export default DirectionsPanel;
