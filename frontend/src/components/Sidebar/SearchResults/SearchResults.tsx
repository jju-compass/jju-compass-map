import React, { useState, useMemo } from 'react';
import { PlaceItem } from '../PlaceItem';
import { Loading, Icon, PlaceListSkeleton } from '@components/common';
import { addDistanceToPlaces, sortPlaces, formatDistance, type SortType } from '../../../utils';
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
  const [sortBy, setSortBy] = useState<SortType>('distance');

  // 거리 정보 추가 및 정렬
  const sortedResults = useMemo(() => {
    if (results.length === 0) return [];
    const withDistance = addDistanceToPlaces(results);
    return sortPlaces(withDistance, sortBy);
  }, [results, sortBy]);

  const classes = ['search-results', className].filter(Boolean).join(' ');

  // Loading state - 스켈레톤 UI 사용
  if (isLoading) {
    return (
      <div className={classes}>
        <div className="search-results-header">
          <span className="search-results-count">검색 중...</span>
        </div>
        <div className="search-results-list">
          <PlaceListSkeleton count={5} showRank={true} />
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
        <div className="search-results-sort">
          <label htmlFor="sortSelect" className="sr-only">정렬</label>
          <select
            id="sortSelect"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
          >
            <option value="distance">거리순</option>
            <option value="name">이름순</option>
          </select>
        </div>
      </div>
      <div className="search-results-list">
        {sortedResults.map((place, index) => (
          <PlaceItem
            key={place.id}
            place={place}
            index={index}
            isSelected={selectedPlace?.id === place.id}
            isFavorite={favorites.has(place.id)}
            distance={place._distance ? formatDistance(place._distance) : undefined}
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
