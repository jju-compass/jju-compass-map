import React from 'react';
import { Button, Icon } from '@components/common';
import { formatDistance } from '../../../utils/distance';
import { SoundEffects } from '../../../utils/soundEffects';
import type { Place } from '../../../types';
import './PlaceDetail.css';

export interface PlaceDetailProps {
  place: Place;
  isFavorite?: boolean;
  onClose?: () => void;
  onFavoriteToggle?: (place: Place) => void;
  onDirections?: (place: Place) => void;
  onShare?: (place: Place) => void;
  className?: string;
}

export const PlaceDetail: React.FC<PlaceDetailProps> = ({
  place,
  isFavorite = false,
  onClose,
  onFavoriteToggle,
  onDirections,
  onShare,
  className = '',
}) => {
  const address = place.road_address_name || place.address_name;
  const categories = place.category_name?.split(' > ') || [];

  const handleKakaoMapLink = () => {
    window.open(place.place_url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      alert('주소가 복사되었습니다.');
    } catch {
      alert('주소 복사에 실패했습니다.');
    }
  };

  const classes = ['place-detail', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Header */}
      <div className="place-detail-header">
        <div className="place-detail-title-wrap">
          <h2 className="place-detail-title">{place.place_name}</h2>
          {categories.length > 0 && (
            <div className="place-detail-categories">
              {categories.map((cat, idx) => (
                <span key={idx} className="place-detail-category">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <button className="place-detail-close" onClick={onClose} aria-label="닫기">
            <Icon name="close" size="md" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="place-detail-content">
        {/* Address */}
        {address && (
          <div className="place-detail-row">
            <Icon name="location" size="sm" />
            <div className="place-detail-row-content">
              <span className="place-detail-address">{address}</span>
              {place.address_name && place.road_address_name && (
                <span className="place-detail-address-sub">
                  (지번) {place.address_name}
                </span>
              )}
            </div>
            <button
              className="place-detail-copy"
              onClick={handleCopyAddress}
              title="주소 복사"
            >
              복사
            </button>
          </div>
        )}

        {/* Phone */}
        {place.phone && (
          <div className="place-detail-row">
            <Icon name="phone" size="sm" />
            <a href={`tel:${place.phone}`} className="place-detail-phone">
              {place.phone}
            </a>
          </div>
        )}

        {/* Distance */}
        {place.distance && (
          <div className="place-detail-row">
            <Icon name="walking" size="sm" />
            <span className="place-detail-distance">
              현재 위치에서 {formatDistance(parseInt(place.distance, 10))}
            </span>
          </div>
        )}

        {/* Kakao Map Link */}
        <div className="place-detail-row">
          <Icon name="info" size="sm" />
          <button className="place-detail-link" onClick={handleKakaoMapLink}>
            카카오맵에서 보기
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="place-detail-actions">
        {onFavoriteToggle && (
          <Button
            variant={isFavorite ? 'secondary' : 'ghost'}
            size="md"
            icon={<Icon name={isFavorite ? 'star-filled' : 'star'} size="sm" />}
            onClick={() => onFavoriteToggle(place)}
          >
            {isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
          </Button>
        )}
        {onDirections && (
          <Button
            variant="primary"
            size="md"
            icon={<Icon name="directions" size="sm" />}
            onClick={() => {
              SoundEffects.playClick();
              onDirections(place);
            }}
          >
            길찾기
          </Button>
        )}
        {onShare && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => onShare(place)}
          >
            공유
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlaceDetail;
