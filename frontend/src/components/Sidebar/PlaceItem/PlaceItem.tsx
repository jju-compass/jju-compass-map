import React from 'react';
import { Icon } from '@components/common';
import type { Place } from '../../../types';
import './PlaceItem.css';

export interface PlaceItemProps {
  place: Place;
  index?: number;
  isSelected?: boolean;
  isFavorite?: boolean;
  distance?: string; // 외부에서 계산된 거리 문자열
  onClick?: (place: Place) => void;
  onFavoriteToggle?: (place: Place) => void;
  onDirections?: (place: Place) => void;
  showDistance?: boolean;
}

export const PlaceItem: React.FC<PlaceItemProps> = ({
  place,
  index,
  isSelected = false,
  isFavorite = false,
  distance,
  onClick,
  onFavoriteToggle,
  onDirections,
  showDistance = true,
}) => {
  const address = place.road_address_name || place.address_name;
  const category = place.category_name?.split(' > ').pop() || '';

  const handleClick = () => {
    onClick?.(place);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(place);
  };

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDirections?.(place);
  };

  // 거리 표시 (외부에서 전달받은 distance 우선, 없으면 place.distance 사용)
  const displayDistance = distance || (place.distance ? formatDistanceFromString(place.distance) : null);

  const classes = [
    'place-item',
    isSelected && 'place-item-selected',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={handleClick} role="button" tabIndex={0}>
      {typeof index === 'number' && (
        <div className={`place-item-index ${getRankClass(index)}`}>
          {getRankBadge(index)}
        </div>
      )}
      
      <div className="place-item-content">
        <div className="place-item-header">
          <h3 className="place-item-name">{place.place_name}</h3>
          {category && (
            <span className="place-item-category">{category}</span>
          )}
        </div>
        
        {address && (
          <p className="place-item-address">
            <Icon name="location" size="sm" />
            <span>{address}</span>
          </p>
        )}
        
        {place.phone && (
          <p className="place-item-phone">
            <Icon name="phone" size="sm" />
            <a href={`tel:${place.phone}`} onClick={(e) => e.stopPropagation()}>
              {place.phone}
            </a>
          </p>
        )}
        
        {showDistance && displayDistance && (
          <p className="place-item-distance">
            {displayDistance}
          </p>
        )}
      </div>

      <div className="place-item-actions">
        {onFavoriteToggle && (
          <button
            className={`place-item-action ${isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <Icon name={isFavorite ? 'star-filled' : 'star'} size="sm" />
          </button>
        )}
        {onDirections && (
          <button
            className="place-item-action"
            onClick={handleDirectionsClick}
            aria-label="길찾기"
            title="길찾기"
          >
            <Icon name="directions" size="sm" />
          </button>
        )}
      </div>
    </div>
  );
};

// 카카오 API의 distance 문자열을 포맷팅
function formatDistanceFromString(distanceStr: string): string {
  const meters = parseInt(distanceStr, 10);
  if (isNaN(meters)) return distanceStr;
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// 상위 3개에 랭킹 뱃지 클래스 반환
function getRankClass(index: number): string {
  switch (index) {
    case 0: return 'rank-gold';
    case 1: return 'rank-silver';
    case 2: return 'rank-bronze';
    default: return '';
  }
}

// 랭킹 뱃지 또는 숫자 반환
function getRankBadge(index: number): string | number {
  switch (index) {
    case 0: return '🥇';
    case 1: return '🥈';
    case 2: return '🥉';
    default: return index + 1;
  }
}

export default PlaceItem;
