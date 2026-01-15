import React from 'react';
import { Icon } from '@components/common';
import { formatDistance } from '../../../utils/distance';
import './RouteInfoOverlay.css';

export interface RouteInfoOverlayProps {
  originName: string;
  destinationName: string;
  duration: number;  // seconds
  distance: number;  // meters
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
}

export const RouteInfoOverlay: React.FC<RouteInfoOverlayProps> = ({
  originName,
  destinationName,
  duration,
  distance,
  onClose,
}) => {
  return (
    <div className="route-info-overlay" role="status" aria-live="polite">
      <div className="route-info-header">
        <span className="route-info-route">
          {originName} → {destinationName}
        </span>
        <button 
          className="route-info-close" 
          onClick={onClose}
          aria-label="경로 닫기"
        >
          <Icon name="close" size="sm" />
        </button>
      </div>
      <div className="route-info-details">
        <Icon name="walking" size="md" />
        <span className="route-info-duration">{formatDuration(duration)}</span>
        <span className="route-info-separator">·</span>
        <span className="route-info-distance">{formatDistance(distance)}</span>
      </div>
    </div>
  );
};

export default RouteInfoOverlay;
