import React from 'react';
import { PlaceItem } from '../PlaceItem';
import { Loading, Icon } from '@components/common';
import type { Place } from '../../../types';
import './SearchResults.css';

export interface SearchResultsProps {
  results: Place[];
  selectedPlace?: Place | null;
  favorites?: Set<string>;
  isLoading?: boolean;
  error?: string | null;
  keyword?: string;
  onPlaceClick?: (place: Place) => void;
  onFavoriteToggle?: (place: Place) => void;
  onDirections?: (place: Place) => void;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  selectedPlace,
  favorites = new Set(),
  isLoading = false,
  error,
  keyword,
  onPlaceClick,
  onFavoriteToggle,
  onDirections,
  className = '',
}) => {
  const classes = ['search-results', className].filter(Boolean).join(' ');

  // Loading state
  if (isLoading) {
    return (
      <div className={classes}>
        <div className="search-results-loading">
          <Loading size="md" text="검색 중..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={classes}>
        <div className="search-results-error">
          <Icon name="info" size="lg" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state (after search)
  if (keyword && results.length === 0) {
    return (
      <div className={classes}>
        <div className="search-results-empty">
          <Icon name="search" size="lg" />
          <p>'{keyword}'에 대한 검색 결과가 없습니다.</p>
          <span>다른 검색어로 시도해보세요.</span>
        </div>
      </div>
    );
  }

  // No search yet
  if (results.length === 0) {
    return (
      <div className={classes}>
        <div className="search-results-initial">
          <Icon name="search" size="lg" />
          <p>장소를 검색해보세요</p>
          <span>전주대학교 주변 장소를 찾아드립니다.</span>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className={classes}>
      <div className="search-results-header">
        <span className="search-results-count">
          검색 결과 <strong>{results.length}</strong>건
        </span>
        {keyword && (
          <span className="search-results-keyword">"{keyword}"</span>
        )}
      </div>
      <div className="search-results-list">
        {results.map((place, index) => (
          <PlaceItem
            key={place.id}
            place={place}
            index={index}
            isSelected={selectedPlace?.id === place.id}
            isFavorite={favorites.has(place.id)}
            onClick={onPlaceClick}
            onFavoriteToggle={onFavoriteToggle}
            onDirections={onDirections}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
