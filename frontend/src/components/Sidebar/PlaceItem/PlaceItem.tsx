import React from 'react';
import { Icon } from '@components/common';
import type { Place } from '../../../types';
import './PlaceItem.css';

export interface PlaceItemProps {
  place: Place;
  index?: number;
  isSelected?: boolean;
  isFavorite?: boolean;
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

  const classes = [
    'place-item',
    isSelected && 'place-item-selected',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={handleClick} role="button" tabIndex={0}>
      {typeof index === 'number' && (
        <div className="place-item-index">{index + 1}</div>
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
        
        {showDistance && place.distance && (
          <p className="place-item-distance">
            {formatDistance(parseInt(place.distance, 10))}
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

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export default PlaceItem;
