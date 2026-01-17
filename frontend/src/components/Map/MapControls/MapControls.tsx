import React, { useState, useEffect } from 'react';
import { useMapStore } from '@store/mapStore';
import { useGeolocation } from '@hooks/useGeolocation';
import { Icon } from '@components/common';
import { SoundEffects } from '../../../utils/soundEffects';
import './MapControls.css';

export interface MapControlsProps {
  className?: string;
  showZoom?: boolean;
  showMyLocation?: boolean;
  showHome?: boolean;
  showFavorites?: boolean;
  showHistory?: boolean;
  showFavoritesFilter?: boolean;
  isFavoritesFilterActive?: boolean;
  onHomeClick?: () => void;
  onFavoritesClick?: () => void;
  onHistoryClick?: () => void;
  onFavoritesFilterToggle?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  className = '',
  showZoom = true,
  showMyLocation = true,
  showHome = false,
  showFavorites = false,
  showHistory = false,
  showFavoritesFilter = false,
  isFavoritesFilterActive = false,
  onHomeClick,
  onFavoritesClick,
  onHistoryClick,
  onFavoritesFilterToggle,
}) => {
  const { map, zoom, setZoom, setCenter, setCurrentLocation } = useMapStore();
  const { getCurrentLocation } = useGeolocation();
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 메뉴 토글
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleZoomIn = () => {
    if (!map) return;
    const newLevel = Math.max(1, zoom - 1);
    map.setLevel(newLevel, { animate: true });
    setZoom(newLevel);
  };

  const handleZoomOut = () => {
    if (!map) return;
    const newLevel = Math.min(14, zoom + 1);
    map.setLevel(newLevel, { animate: true });
    setZoom(newLevel);
  };

  const handleMyLocation = async () => {
    SoundEffects.playClick();
    if (!map) return;
    
    setIsGeoLoading(true);
    try {
      const position = await getCurrentLocation();
      const { lat, lng } = position;
      
      setCurrentLocation({ lat, lng });
      setCenter({ lat, lng });
      
      const moveLatLng = new kakao.maps.LatLng(lat, lng);
      map.panTo(moveLatLng);
    } catch (error) {
      console.error('Failed to get current location:', error);
      alert('현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
    } finally {
      setIsGeoLoading(false);
    }
  };

  const handleHome = () => {
    SoundEffects.playClick();
    if (onHomeClick) {
      onHomeClick();
    }
  };

  const classes = ['map-controls', className].filter(Boolean).join(' ');

  // 메뉴 버튼들 렌더링
  const renderMenuButtons = () => (
    <>
      {showMyLocation && (
        <button
          className={`map-control-btn map-control-btn-labeled ${isGeoLoading ? 'loading' : ''}`}
          onClick={handleMyLocation}
          disabled={isGeoLoading}
          aria-label="내 위치"
          title="내 위치로 이동"
        >
          <span className="map-control-emoji">📍</span>
          <span className="map-control-label">내 위치</span>
        </button>
      )}

      {showHome && (
        <button
          className="map-control-btn map-control-btn-labeled"
          onClick={handleHome}
          aria-label="홈 위치"
          title="홈 위치로 이동"
        >
          <span className="map-control-emoji">🏠</span>
          <span className="map-control-label">홈</span>
        </button>
      )}

      {showFavorites && (
        <button
          className="map-control-btn map-control-btn-labeled"
          onClick={() => {
            SoundEffects.playClick();
            onFavoritesClick?.();
          }}
          aria-label="즐겨찾기"
          title="즐겨찾기 목록"
        >
          <span className="map-control-emoji">⭐</span>
          <span className="map-control-label">즐겨찾기</span>
        </button>
      )}

      {showFavoritesFilter && (
        <button
          className={`map-control-btn map-control-btn-labeled ${isFavoritesFilterActive ? 'active' : ''}`}
          onClick={() => {
            SoundEffects.playClick();
            onFavoritesFilterToggle?.();
          }}
          aria-label="즐겨찾기만 표시"
          aria-pressed={isFavoritesFilterActive}
          title={isFavoritesFilterActive ? '전체 장소 표시' : '즐겨찾기만 표시'}
        >
          <span className="map-control-emoji">{isFavoritesFilterActive ? '⭐' : '☆'}</span>
          <span className="map-control-label">{isFavoritesFilterActive ? '필터 해제' : '즐겨찾기만'}</span>
        </button>
      )}

      {showHistory && (
        <button
          className="map-control-btn map-control-btn-labeled"
          onClick={() => {
            SoundEffects.playClick();
            onHistoryClick?.();
          }}
          aria-label="검색 기록"
          title="검색 기록"
        >
          <span className="map-control-emoji">🕐</span>
          <span className="map-control-label">기록</span>
        </button>
      )}
    </>
  );

  return (
    <>
      {/* 줌 컨트롤 - 오른쪽 중간 */}
      {showZoom && (
        <div className="map-controls-zoom">
          <button
            className="map-control-btn"
            onClick={handleZoomIn}
            aria-label="확대"
            title="확대"
          >
            <Icon name="plus" size="sm" />
          </button>
          <button
            className="map-control-btn"
            onClick={handleZoomOut}
            aria-label="축소"
            title="축소"
          >
            <Icon name="minus" size="sm" />
          </button>
        </div>
      )}

      {/* 메인 컨트롤 - 오른쪽 하단 */}
      {isMobile ? (
        // 모바일: 햄버거 메뉴
        <div className="map-controls-mobile">
          {/* 햄버거 버튼 */}
          <button
            className="map-control-btn map-control-hamburger"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={isMenuOpen}
          >
            <span className="map-control-emoji">{isMenuOpen ? '✕' : '☰'}</span>
          </button>

          {/* 펼쳐진 메뉴 */}
          {isMenuOpen && (
            <div className={classes}>
              {renderMenuButtons()}
            </div>
          )}
        </div>
      ) : (
        // 데스크톱: 항상 표시
        <div className={classes}>
          {renderMenuButtons()}
        </div>
      )}
    </>
  );
};

export default MapControls;
