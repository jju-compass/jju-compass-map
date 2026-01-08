import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@components/common';
import './MapNavbar.css';

export interface MapNavbarProps {
  onSearch: (keyword: string) => void;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export const MapNavbar: React.FC<MapNavbarProps> = ({
  onSearch,
  onMenuToggle,
  isMenuOpen = false,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  }, [searchValue, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <nav className="map-navbar">
      <div className="map-navbar-left">
        <button
          className="map-navbar-menu-btn"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={isMenuOpen}
        >
          <Icon name={isMenuOpen ? 'close' : 'menu'} size="md" />
        </button>
        <Link to="/" className="map-navbar-logo">
          <Icon name="location" size="md" />
          <span className="map-navbar-logo-text">전주대 주변지도</span>
        </Link>
      </div>

      <form className="map-navbar-search" onSubmit={handleSubmit}>
        <Icon name="search" size="sm" className="map-navbar-search-icon" />
        <input
          type="text"
          className="map-navbar-search-input"
          placeholder="장소, 주소 검색"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="검색어 입력"
        />
        <button
          type="submit"
          className="map-navbar-search-btn"
          aria-label="검색"
        >
          <Icon name="search" size="sm" />
        </button>
      </form>

      <div className="map-navbar-right">
        <Link to="/about" className="map-navbar-link">
          소개
        </Link>
        <Link to="/guide" className="map-navbar-link">
          사용방법
        </Link>
      </div>
    </nav>
  );
};

export default MapNavbar;
