import React from 'react';
import { Icon } from '@components/common';
import { SoundEffects } from '../../../utils/soundEffects';
import type { Place } from '../../../types';
import './PlaceList.css';

export interface PlaceListProps {
  places: Place[];
  selectedPlaceId?: string;
  isLoading?: boolean;
  onPlaceClick: (place: Place) => void;
  onDirectionsClick?: (place: Place) => void;
}

export const PlaceList: React.FC<PlaceListProps> = ({
  places,
  selectedPlaceId,
  isLoading = false,
  onPlaceClick,
  onDirectionsClick,
}) => {
  if (isLoading) {
    return (
      <div className="place-list">
        <div className="place-list-header">
          <h2 className="place-list-title">주변 장소</h2>
          <span className="place-list-count">검색 중...</span>
        </div>
        <div className="place-list-content">
          <div className="place-list-loading">
            <div className="place-list-spinner" />
            <p>장소를 검색하고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="place-list">
        <div className="place-list-header">
          <h2 className="place-list-title">주변 장소</h2>
          <span className="place-list-count">0개</span>
        </div>
        <div className="place-list-content">
          <div className="place-list-empty">
            <Icon name="location" size={48} />
            <p>검색 결과가 없습니다</p>
            <span>다른 카테고리를 선택해보세요</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="place-list">
      <div className="place-list-header">
        <h2 className="place-list-title">주변 장소</h2>
        <span className="place-list-count">{places.length}개</span>
      </div>
      <div className="place-list-content">
        <ul className="place-list-items">
          {places.map((place) => (
            <li key={place.id}>
              <article
                className={`place-card ${
                  selectedPlaceId === place.id ? 'place-card-selected' : ''
                }`}
                onClick={() => onPlaceClick(place)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPlaceClick(place);
                  }
                }}
              >
                <div className="place-card-icon">
                  <Icon name="location" size="sm" />
                </div>
                <div className="place-card-content">
                  <h3 className="place-card-name">{place.place_name}</h3>
                  <p className="place-card-address">
                    {place.road_address_name || place.address_name}
                  </p>
                  {place.phone && (
                    <p className="place-card-phone">
                      <Icon name="phone" size={12} />
                      {place.phone}
                    </p>
                  )}
                  {place.category_name && (
                    <span className="place-card-category">
                      {place.category_name.split(' > ').pop()}
                    </span>
                  )}
                </div>
                {onDirectionsClick && (
                  <button
                    className="place-card-directions"
                    onClick={(e) => {
                      e.stopPropagation();
                      SoundEffects.playClick();
                      onDirectionsClick(place);
                    }}
                    aria-label={`${place.place_name} 길찾기`}
                  >
                    <Icon name="directions" size={14} />
                    <span>길찾기</span>
                  </button>
                )}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PlaceList;
