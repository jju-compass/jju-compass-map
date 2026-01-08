import React from 'react';
import './RouteInfoPanel.css';

interface RouteInfoPanelProps {
  distance: number; // meters
  duration: number; // minutes
  isAnimating?: boolean;
  progress?: number; // 0 ~ 1
  onClose?: () => void;
}

/**
 * 경로 정보 패널
 * - 거리와 예상 시간 표시
 * - 애니메이션 진행률 표시 (옵션)
 */
export const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({
  distance,
  duration,
  isAnimating = false,
  progress = 0,
  onClose,
}) => {
  // 거리 포맷팅
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return {
        value: (meters / 1000).toFixed(2),
        unit: 'km',
      };
    }
    return {
      value: Math.round(meters).toString(),
      unit: 'm',
    };
  };

  const distanceFormatted = formatDistance(distance);

  return (
    <div className={`route-info-panel ${isAnimating ? 'animating' : ''}`}>
      <div className="route-info-header">
        <div className="route-info-icon">🚶</div>
        <div className="route-info-title">도보 경로</div>
        {onClose && (
          <button className="route-info-close" onClick={onClose} aria-label="닫기">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="route-info-stats">
        <div className="route-info-stat">
          <div className="route-info-stat-value">
            {distanceFormatted.value}
            <span className="unit">{distanceFormatted.unit}</span>
          </div>
          <div className="route-info-stat-label">거리</div>
        </div>

        <div className="route-info-divider" />

        <div className="route-info-stat">
          <div className="route-info-stat-value">
            {duration}
            <span className="unit">분</span>
          </div>
          <div className="route-info-stat-label">예상 시간</div>
        </div>
      </div>

      {/* 진행률 바 (애니메이션 중일 때) */}
      {isAnimating && (
        <div className="route-info-progress">
          <div
            className="route-info-progress-bar"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default RouteInfoPanel;
