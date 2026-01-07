import React, { useState } from 'react';
import { SearchBar } from '../SearchBar';
import { SearchResults } from '../SearchResults';
import { Icon } from '@components/common';
import { useMapStore } from '@store/mapStore';
import { useUserStore } from '@store/userStore';
import { useSearch } from '@hooks/useSearch';
import { useFavorites } from '@hooks/useFavorites';
import { useHistory } from '@hooks/useHistory';
import type { Place } from '../../../types';
import './Sidebar.css';

export interface SidebarProps {
  className?: string;
  onPlaceSelect?: (place: Place) => void;
  onDirections?: (place: Place) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  onPlaceSelect,
  onDirections,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { searchResults, selectedPlace, setSelectedPlace, isLoading, error } = useMapStore();
  const { searchKeyword } = useUserStore();
  const { search } = useSearch();
  const { favorites, toggleFavorite } = useFavorites();
  const { popularKeywords } = useHistory();

  // Convert favorites array to Set<string> for SearchResults component
  const favoritesSet = new Set(favorites.map(f => f.place_id));

  const handleSearch = async (searchKeyword: string) => {
    await search(searchKeyword);
  };

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place);
    onPlaceSelect?.(place);
  };

  const handleFavoriteToggle = async (place: Place) => {
    try {
      await toggleFavorite(place);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDirections = (place: Place) => {
    onDirections?.(place);
  };

  const handlePopularKeywordClick = (keyword: string) => {
    search(keyword);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const classes = [
    'sidebar',
    isCollapsed && 'sidebar-collapsed',
    className,
  ].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      <button
        className="sidebar-toggle"
        onClick={toggleCollapse}
        aria-label={isCollapsed ? '사이드바 열기' : '사이드바 닫기'}
      >
        <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} size="sm" />
      </button>

      {!isCollapsed && (
        <>
          <div className="sidebar-header">
            <h1 className="sidebar-title">
              <Icon name="location" size="md" />
              전주대 길찾기
            </h1>
          </div>

          <div className="sidebar-search">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              placeholder="장소, 건물명 검색"
            />
          </div>

          <div className="sidebar-content">
            <SearchResults
              results={searchResults}
              selectedPlace={selectedPlace}
              favorites={favoritesSet}
              isLoading={isLoading}
              error={error}
              keyword={searchKeyword}
              popularKeywords={popularKeywords}
              onPlaceClick={handlePlaceClick}
              onFavoriteToggle={handleFavoriteToggle}
              onDirections={handleDirections}
              onPopularKeywordClick={handlePopularKeywordClick}
            />
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
