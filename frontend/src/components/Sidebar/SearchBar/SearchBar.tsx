import React, { useState, useCallback, FormEvent, KeyboardEvent } from 'react';
import { Icon } from '@components/common';
import './SearchBar.css';

export interface SearchBarProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = '장소 검색',
  isLoading = false,
  className = '',
  autoFocus = false,
}) => {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed && !isLoading) {
      onSearch(trimmed);
    }
  }, [keyword, isLoading, onSearch]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleClear = useCallback(() => {
    setKeyword('');
  }, []);

  const classes = ['search-bar', className].filter(Boolean).join(' ');

  return (
    <form className={classes} onSubmit={handleSubmit}>
      <div className="search-bar-container">
        <span className="search-bar-icon">
          <Icon name="search" size="sm" />
        </span>
        <input
          type="text"
          className="search-bar-input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isLoading}
          aria-label="검색어 입력"
        />
        {keyword && (
          <button
            type="button"
            className="search-bar-clear"
            onClick={handleClear}
            aria-label="검색어 지우기"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
        <button
          type="submit"
          className="search-bar-submit"
          disabled={!keyword.trim() || isLoading}
          aria-label="검색"
        >
          {isLoading ? (
            <span className="search-bar-spinner" />
          ) : (
            '검색'
          )}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
