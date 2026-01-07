import React, { useState, useRef, useCallback } from 'react';
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

interface SwipeState {
  id: number | null;
  startX: number;
  currentX: number;
  swiping: boolean;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  favorites,
  isLoading = false,
  onSelect,
  onRemove,
  onClose,
  className = '',
}) => {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    id: null,
    startX: 0,
    currentX: 0,
    swiping: false,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  // 스와이프 시작
  const handleTouchStart = useCallback((e: React.TouchEvent, id: number) => {
    setSwipeState({
      id,
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
      swiping: true,
    });
  }, []);

  // 스와이프 중
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.swiping) return;
    setSwipeState((prev) => ({
      ...prev,
      currentX: e.touches[0].clientX,
    }));
  }, [swipeState.swiping]);

  // 스와이프 종료
  const handleTouchEnd = useCallback((favorite: Favorite) => {
    if (!swipeState.swiping) return;

    const diff = swipeState.startX - swipeState.currentX;
    const threshold = 80; // 삭제 임계값

    if (diff > threshold && onRemove) {
      // 삭제 애니메이션
      setDeletingId(favorite.id);
      setTimeout(() => {
        onRemove(favorite);
        setDeletingId(null);
      }, 300);
    }

    setSwipeState({
      id: null,
      startX: 0,
      currentX: 0,
      swiping: false,
    });
  }, [swipeState, onRemove]);

  // 스와이프 오프셋 계산
  const getSwipeOffset = (id: number) => {
    if (swipeState.id !== id || !swipeState.swiping) return 0;
    const diff = swipeState.startX - swipeState.currentX;
    return Math.max(0, Math.min(100, diff)); // 0 ~ 100px 제한
  };

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
            {favorites.map((favorite, index) => {
              const offset = getSwipeOffset(favorite.id);
              const isDeleting = deletingId === favorite.id;

              return (
                <li
                  key={favorite.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(favorite.id, el);
                  }}
                  className={`favorite-item ${isDeleting ? 'deleting' : ''}`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                  onTouchStart={(e) => handleTouchStart(e, favorite.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(favorite)}
                  data-list-item
                  tabIndex={0}
                  role="button"
                  aria-label={`${favorite.place_name}, ${favorite.road_address || favorite.address}`}
                >
                  {/* 삭제 배경 */}
                  <div className="favorite-item-delete-bg">
                    <Icon name="delete" size="sm" />
                    <span>삭제</span>
                  </div>

                  {/* 메인 콘텐츠 */}
                  <div
                    className="favorite-item-main"
                    style={{
                      transform: `translateX(-${offset}px)`,
                    }}
                  >
                    <button
                      className="favorite-item-content"
                      onClick={() => onSelect?.(favorite)}
                    >
                      <div className="favorite-item-icon">
                        <span>⭐</span>
                      </div>
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {favorites.length > 0 && (
        <div className="favorites-panel-footer">
          <span className="favorites-panel-count">
            총 {favorites.length}개
          </span>
          <span className="favorites-panel-hint">
            왼쪽으로 스와이프하여 삭제
          </span>
        </div>
      )}
    </div>
  );
};

export default FavoritesPanel;
