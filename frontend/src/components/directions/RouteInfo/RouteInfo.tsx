import React from 'react';
import { Icon } from '@components/common';
import type { RouteInfo as RouteInfoType, RouteSection } from '../../../types';
import './RouteInfo.css';

export interface RouteInfoProps {
  routeInfo: RouteInfoType;
  transportMode?: 'walking' | 'car' | 'transit';
  className?: string;
}

export const RouteInfo: React.FC<RouteInfoProps> = ({
  routeInfo,
  transportMode = 'walking',
  className = '',
}) => {
  const classes = ['route-info', className].filter(Boolean).join(' ');

  const getModeIcon = () => {
    switch (transportMode) {
      case 'car': return 'car';
      case 'transit': return 'transit';
      default: return 'walking';
    }
  };

  const getModeLabel = () => {
    switch (transportMode) {
      case 'car': return '자동차';
      case 'transit': return '대중교통';
      default: return '도보';
    }
  };

  return (
    <div className={classes}>
      {/* Summary */}
      <div className="route-info-summary">
        <div className="route-info-mode">
          <Icon name={getModeIcon()} size="lg" />
          <span>{getModeLabel()}</span>
        </div>
        <div className="route-info-stats">
          <div className="route-info-stat">
            <span className="route-info-stat-value">{formatDuration(routeInfo.duration)}</span>
            <span className="route-info-stat-label">예상 시간</span>
          </div>
          <div className="route-info-stat-divider" />
          <div className="route-info-stat">
            <span className="route-info-stat-value">{formatDistance(routeInfo.distance)}</span>
            <span className="route-info-stat-label">총 거리</span>
          </div>
        </div>
      </div>

      {/* Route Steps */}
      {routeInfo.sections && routeInfo.sections.length > 0 && (
        <div className="route-info-steps">
          <h3 className="route-info-steps-title">경로 안내</h3>
          <ul className="route-info-steps-list">
            {routeInfo.sections.map((section, index) => (
              <RouteStep
                key={index}
                section={section}
                stepNumber={index + 1}
                isLast={index === routeInfo.sections!.length - 1}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface RouteStepProps {
  section: RouteSection;
  stepNumber: number;
  isLast: boolean;
}

const RouteStep: React.FC<RouteStepProps> = ({ section, stepNumber, isLast }) => {
  const roadNames = section.roads
    .map((road) => road.name)
    .filter((name) => name)
    .slice(0, 3);

  return (
    <li className={`route-step ${isLast ? 'route-step-last' : ''}`}>
      <div className="route-step-marker">
        <span>{stepNumber}</span>
      </div>
      <div className="route-step-content">
        <div className="route-step-roads">
          {roadNames.length > 0 ? roadNames.join(' → ') : '경로'}
        </div>
        <div className="route-step-meta">
          <span>{formatDistance(section.distance)}</span>
          <span>·</span>
          <span>{formatDuration(section.duration)}</span>
        </div>
      </div>
    </li>
  );
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  if (mins === 0) {
    return '1분 미만';
  }
  return `${mins}분`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export default RouteInfo;
