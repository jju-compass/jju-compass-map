import React from 'react';
import { Icon, Loading } from '@components/common';
import type { Favorite } from '../../../types';
import './FavoritesPanel.css';

export interface FavoritesPanelProps {
  favorites: Favorite[];
  isLoading?: boolean;
  onSelect?: (favorite: Favorite) => void;
  onRemove?: (favorite: Favorite) => void;
  onClose?: () => void;
  className?: string;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  favorites,
  isLoading = false,
  onSelect,
  onRemove,
  onClose,
  className = '',
}) => {
  const classes = ['favorites-panel', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Header */}
      <div className="favorites-panel-header">
        <h2 className="favorites-panel-title">
          <Icon name="star-filled" size="md" />
          즐겨찾기
        </h2>
        {onClose && (
          <button className="favorites-panel-close" onClick={onClose} aria-label="닫기">
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="favorites-panel-content">
        {isLoading ? (
          <div className="favorites-panel-loading">
            <Loading size="md" text="불러오는 중..." />
          </div>
        ) : favorites.length === 0 ? (
          <div className="favorites-panel-empty">
            <Icon name="star" size="lg" />
            <p>저장된 즐겨찾기가 없습니다</p>
            <span>자주 가는 장소를 즐겨찾기에 추가해보세요.</span>
          </div>
        ) : (
          <ul className="favorites-panel-list">
            {favorites.map((favorite) => (
              <li key={favorite.id} className="favorite-item">
                <button
                  className="favorite-item-content"
                  onClick={() => onSelect?.(favorite)}
                >
                  <div className="favorite-item-info">
                    <span className="favorite-item-name">{favorite.place_name}</span>
                    <span className="favorite-item-address">
                      {favorite.road_address || favorite.address}
                    </span>
                    {favorite.category && (
                      <span className="favorite-item-category">{favorite.category}</span>
                    )}
                  </div>
                </button>
                {onRemove && (
                  <button
                    className="favorite-item-remove"
                    onClick={() => onRemove(favorite)}
                    aria-label="즐겨찾기 삭제"
                    title="삭제"
                  >
                    <Icon name="delete" size="sm" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {favorites.length > 0 && (
        <div className="favorites-panel-footer">
          <span className="favorites-panel-count">
            총 {favorites.length}개
          </span>
        </div>
      )}
    </div>
  );
};

export default FavoritesPanel;
