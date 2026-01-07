import React from 'react';
import './Skeleton.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circle' | 'rect';
  className?: string;
}

/**
 * 기본 스켈레톤 컴포넌트
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  className = '',
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`}
      style={style}
    />
  );
};

/**
 * 검색 결과 아이템 스켈레톤
 */
export const PlaceItemSkeleton: React.FC<{ showRank?: boolean }> = ({ showRank = true }) => (
  <div className="skeleton-place-item">
    {showRank && <div className="skeleton skeleton-circle skeleton-place-rank" />}
    <div className="skeleton-place-content">
      <div className="skeleton skeleton-text skeleton-place-title" />
      <div className="skeleton skeleton-text skeleton-place-category" />
      <div className="skeleton skeleton-text skeleton-place-address" />
      <div className="skeleton skeleton-text skeleton-place-distance" />
    </div>
    <div className="skeleton skeleton-circle skeleton-place-action" />
  </div>
);

/**
 * 검색 결과 목록 스켈레톤
 */
export const PlaceListSkeleton: React.FC<{ count?: number; showRank?: boolean }> = ({ 
  count = 5,
  showRank = true,
}) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <PlaceItemSkeleton key={i} showRank={showRank} />
    ))}
  </>
);

/**
 * 즐겨찾기 아이템 스켈레톤
 */
export const FavoriteItemSkeleton: React.FC = () => (
  <div className="skeleton-favorite-item">
    <div className="skeleton skeleton-circle skeleton-favorite-icon" />
    <div className="skeleton-favorite-content">
      <div className="skeleton skeleton-text skeleton-favorite-name" />
      <div className="skeleton skeleton-text skeleton-favorite-address" />
    </div>
  </div>
);

/**
 * 즐겨찾기 목록 스켈레톤
 */
export const FavoriteListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <FavoriteItemSkeleton key={i} />
    ))}
  </>
);

/**
 * 히스토리 아이템 스켈레톤
 */
export const HistoryItemSkeleton: React.FC = () => (
  <div className="skeleton-history-item">
    <div className="skeleton skeleton-circle skeleton-history-icon" />
    <div className="skeleton skeleton-text skeleton-history-text" />
  </div>
);

/**
 * 히스토리 목록 스켈레톤
 */
export const HistoryListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <HistoryItemSkeleton key={i} />
    ))}
  </>
);

/**
 * 디테일 패널 스켈레톤
 */
export const DetailSkeleton: React.FC = () => (
  <div className="skeleton-detail">
    <div className="skeleton-detail-header">
      <div className="skeleton skeleton-rect skeleton-detail-image" />
      <div className="skeleton-detail-info">
        <div className="skeleton skeleton-text skeleton-detail-title" />
        <div className="skeleton skeleton-text skeleton-detail-category" />
        <div className="skeleton skeleton-text skeleton-detail-rating" />
      </div>
    </div>
    <div className="skeleton-detail-body">
      <div className="skeleton-detail-row">
        <div className="skeleton skeleton-circle skeleton-detail-row-icon" />
        <div className="skeleton skeleton-text skeleton-detail-row-text" />
      </div>
      <div className="skeleton-detail-row">
        <div className="skeleton skeleton-circle skeleton-detail-row-icon" />
        <div className="skeleton skeleton-text skeleton-detail-row-text" />
      </div>
      <div className="skeleton-detail-row">
        <div className="skeleton skeleton-circle skeleton-detail-row-icon" />
        <div className="skeleton skeleton-text skeleton-detail-row-text" />
      </div>
    </div>
    <div className="skeleton-detail-actions">
      <div className="skeleton skeleton-rect skeleton-detail-btn" />
      <div className="skeleton skeleton-rect skeleton-detail-btn" />
    </div>
  </div>
);

export default Skeleton;
