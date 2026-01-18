import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KakaoMap,
  PlaceMarkerCluster,
  MapControls,
  MapNavbar,
  CategorySidebar,
  CategoryHeader,
  PlaceList,
  categoryData,
  type Category,
} from '../../components/Map';
import { HomeMarker, StartFlagMarker } from '../../components/Map/CustomMarkers';
import { PlaceDetail, FavoritesPanel, HistoryPanel } from '../../components/panels';
import { DirectionsPanel, RoutePolyline, RouteInfoOverlay } from '../../components/directions';
import { Loading, ToastContainer, SoundToggle, SkipLink } from '../../components/common';
import { HomeSettingModal, RouteStartModal } from '../../components/modals';
import { useMapStore } from '../../store/mapStore';
import { useUserStore } from '../../store/userStore';
import { useRouteStore } from '../../store/routeStore';
import { useFavorites } from '../../hooks/useFavorites';
import { useHistory } from '../../hooks/useHistory';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardAccessibility';
import { useSearch } from '../../hooks/useSearch';
import { useWalkingAnimation } from '../../hooks';
import { directionsAPI } from '../../api';
import { toast } from '../../store/toastStore';
import { SoundEffects } from '../../utils/soundEffects';
import { convertFavoritesToPlaces } from '../../utils/placeConverter';
import { mapConfig } from '../../constants/categories';
import { calculateDistance } from '../../utils/distance';
import type { Place, Coordinates, RouteInfo } from '../../types';
import './MapPage.css';

const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Directions state
  const [directionsOrigin, setDirectionsOrigin] = useState<{
    name: string;
    coordinates: Coordinates;
    place?: Place;
  } | null>(null);
  const [directionsDestination, setDirectionsDestination] = useState<{
    name: string;
    coordinates: Coordinates;
    place?: Place;
  } | null>(null);
  const [routePath, setRoutePath] = useState<Coordinates[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isDirectionsLoading, setIsDirectionsLoading] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  // URL에서 카테고리 파라미터 읽기
  const categoryParam = searchParams.get('category');

  const {
    map,
    searchResults,
    selectedPlace,
    setSelectedPlace,
    currentLocation,
    isLoading,
    showOnlyFavorites,
    setShowOnlyFavorites,
  } = useMapStore();

  const { favorites } = useUserStore();

  // 지도에 표시할 장소 계산 (즐겨찾기 필터 적용)
  const placesToShow = useMemo(() => {
    if (showOnlyFavorites) {
      return convertFavoritesToPlaces(favorites);
    }
    return searchResults;
  }, [showOnlyFavorites, favorites, searchResults]);

  const { search } = useSearch();
  const { toggleFavorite, checkFavorite, loadFavorites } = useFavorites();
  const { history, popularKeywords, loadHistory, loadPopularKeywords, clearHistory } = useHistory();

  // Walking animation hook
  const { startAnimation, stopAnimation } = useWalkingAnimation();

  const {
    homePickMode,
    setHomePickMode,
    setHomePosition,
    startPickMode,
    setStartPickMode,
    setStartPosition,
    setHomeModalOpen,
  } = useRouteStore();

  // Initialize with first category or URL param
  useEffect(() => {
    if (categoryParam) {
      // Find category by name
      for (const group of categoryData) {
        const found = group.categories.find(c => c.name === categoryParam || c.searchKeyword === categoryParam);
        if (found) {
          setSelectedCategory(found);
          search(found.searchKeyword);
          return;
        }
      }
    }
    
    // Default to first category if no URL param
    if (!selectedCategory && categoryData[0]?.categories[0]) {
      const defaultCategory = categoryData[0].categories[0];
      setSelectedCategory(defaultCategory);
      search(defaultCategory.searchKeyword);
    }
  }, [categoryParam]);

  // Handle home button click
  const handleHomeClick = useCallback(() => {
    setHomeModalOpen(true);
  }, [setHomeModalOpen]);

  // Handle favorites filter toggle
  const handleFavoritesFilterToggle = useCallback(() => {
    if (!showOnlyFavorites && favorites.length === 0) {
      toast.info('즐겨찾기한 장소가 없습니다');
      return;
    }
    setShowOnlyFavorites(!showOnlyFavorites);
    if (!showOnlyFavorites) {
      toast.success('즐겨찾기한 장소만 표시합니다');
    }
  }, [showOnlyFavorites, favorites.length, setShowOnlyFavorites]);

  // Keyboard shortcuts (ESC to close modals/panels)
  useKeyboardShortcuts({
    onEscape: useCallback(() => {
      if (useRouteStore.getState().isHomeModalOpen) {
        setHomeModalOpen(false);
        return;
      }
      if (useRouteStore.getState().isRouteModalOpen) {
        useRouteStore.getState().setRouteModalOpen(false);
        return;
      }
      if (showFavorites) {
        setShowFavorites(false);
        return;
      }
      if (showHistory) {
        setShowHistory(false);
        return;
      }
      if (selectedPlace) {
        setSelectedPlace(null);
        return;
      }
      if (showDirections) {
        setShowDirections(false);
        return;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    }, [selectedPlace, showDirections, showFavorites, showHistory, isSidebarOpen, setHomeModalOpen, setSelectedPlace]),
  });

  // Load initial data on mount
  useEffect(() => {
    loadFavorites();
    loadHistory();
    loadPopularKeywords();
  }, [loadFavorites, loadHistory, loadPopularKeywords]);

  // Handle map click for home/start pick mode
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (...args: unknown[]) => {
      const mouseEvent = args[0] as kakao.maps.event.MouseEvent;
      const latlng = mouseEvent.latLng;
      const position = { lat: latlng.getLat(), lng: latlng.getLng() };

      if (homePickMode) {
        setHomePosition(position);
        setHomePickMode(false);
        toast.success('홈 위치가 설정되었습니다');
      } else if (startPickMode) {
        setStartPosition(position);
        setStartPickMode(false);
        toast.success('출발지가 설정되었습니다');
      }
    };

    kakao.maps.event.addListener(map, 'click', handleMapClick);

    return () => {
      kakao.maps.event.removeListener(map, 'click', handleMapClick);
    };
  }, [map, homePickMode, startPickMode, setHomePosition, setHomePickMode, setStartPosition, setStartPickMode]);

  // Handle map ready
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    console.log('Map initialized');
  }, []);

  // Clear route (for close button and auto-clear on search)
  const clearRoute = useCallback(() => {
    setRoutePath([]);
    setRouteInfo(null);
    setDirectionsOrigin(null);
    setDirectionsDestination(null);
    stopAnimation();
  }, [stopAnimation]);

  // Handle navbar search
  const handleNavbarSearch = useCallback((keyword: string) => {
    clearRoute();
    setShowOnlyFavorites(false); // 검색 시 즐겨찾기 필터 해제
    search(keyword);
    setSelectedCategory(null);
    SoundEffects.playSearchComplete();
  }, [search, clearRoute, setShowOnlyFavorites]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: Category) => {
    clearRoute();
    setShowOnlyFavorites(false); // 카테고리 선택 시 즐겨찾기 필터 해제
    setSelectedCategory(category);
    search(category.searchKeyword);
    setIsSidebarOpen(false);
    SoundEffects.playSearchComplete();
  }, [search, clearRoute, setShowOnlyFavorites]);

  // Handle place selection from list
  const handlePlaceClick = useCallback((place: Place) => {
    SoundEffects.playClick();
    setSelectedPlace(place);
    
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    if (!isNaN(lat) && !isNaN(lng) && map) {
      // 안전장치: 범위 체크 (검색 결과는 이미 범위 내이지만 혹시 모를 경우)
      const distance = calculateDistance(
        mapConfig.center.lat,
        mapConfig.center.lng,
        lat,
        lng
      );
      
      if (distance > mapConfig.maxDistanceFromCenter) {
        toast.info('전주대학교 캠퍼스 범위를 벗어났습니다');
        return;
      }
      
      map.panTo(new kakao.maps.LatLng(lat, lng));
    }
  }, [map, setSelectedPlace]);

  // Handle directions request
  const handleDirections = useCallback((place: Place) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    
    // 출발지: 전주대학교 공학1관 (기본값)
    setDirectionsOrigin({
      name: '전주대학교 공학1관',
      coordinates: { lat: 35.814445811028584, lng: 127.09236571436321 },
    });
    
    // 도착지: 선택한 장소
    setDirectionsDestination({
      name: place.place_name,
      coordinates: { lat, lng },
      place,
    });

    setShowDirections(true);
  }, []);

  // Handle closing place detail
  const handleClosePlaceDetail = useCallback(() => {
    setSelectedPlace(null);
  }, [setSelectedPlace]);

  // Handle favorite selection from FavoritesPanel
  const handleFavoriteSelect = useCallback((favorite: import('../../types').Favorite) => {
    SoundEffects.playClick();
    // 범위 체크: 즐겨찾기 위치가 캠퍼스 범위 외면 이동하지 않음
    if (favorite.lat && favorite.lng) {
      const distance = calculateDistance(
        mapConfig.center.lat,
        mapConfig.center.lng,
        favorite.lat,
        favorite.lng
      );
      
      if (distance > mapConfig.maxDistanceFromCenter) {
        toast.info('전주대학교 캠퍼스 범위를 벗어났습니다');
        setShowFavorites(false);
        return;
      }
      
      // 지도 이동
      if (map) {
        map.panTo(new kakao.maps.LatLng(favorite.lat, favorite.lng));
      }
    }
    setShowFavorites(false);
    toast.success(`${favorite.place_name}(으)로 이동했습니다`);
  }, [map]);

  // Handle favorite removal from FavoritesPanel
  const handleFavoriteRemove = useCallback(async (favorite: import('../../types').Favorite) => {
    SoundEffects.playClick();
    try {
      await toggleFavorite({
        id: favorite.place_id,
        place_name: favorite.place_name,
        address_name: favorite.address || '',
        road_address_name: favorite.road_address || '',
        x: String(favorite.lng),
        y: String(favorite.lat),
        phone: favorite.phone || '',
        category_name: favorite.category || '',
      } as import('../../types').Place);
      toast.success('즐겨찾기에서 삭제되었습니다');
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
  }, [toggleFavorite]);

  // Handle history item selection from HistoryPanel
  const handleHistorySelect = useCallback((keyword: string) => {
    SoundEffects.playClick();
    search(keyword);
    setSelectedCategory(null);
    setShowHistory(false);
    toast.success(`"${keyword}" 검색 결과를 표시합니다`);
  }, [search]);

  // Handle clear all history
  const handleClearHistory = useCallback(async () => {
    await clearHistory();
    toast.success('검색 기록이 삭제되었습니다');
  }, [clearHistory]);

  // Swap origin and destination
  const handleSwapDirections = useCallback(() => {
    const temp = directionsOrigin;
    setDirectionsOrigin(directionsDestination);
    setDirectionsDestination(temp);
  }, [directionsOrigin, directionsDestination]);

  // Handle directions search
  const handleDirectionsSearch = useCallback(async () => {
    if (!directionsOrigin || !directionsDestination) return;

    setIsDirectionsLoading(true);
    setDirectionsError(null);
    setRoutePath([]);
    setRouteInfo(null);
    stopAnimation(); // 기존 애니메이션 정지

    try {
      const origin = `${directionsOrigin.coordinates.lng},${directionsOrigin.coordinates.lat}`;
      const destination = `${directionsDestination.coordinates.lng},${directionsDestination.coordinates.lat}`;
      
      const response = await directionsAPI.getDirections(origin, destination) as {
        routes?: Array<{
          summary?: { distance?: number; duration?: number };
          sections?: Array<{
            roads?: Array<{
              vertexes?: number[];
            }>;
          }>;
        }>;
      };

      if (response.routes && response.routes.length > 0) {
        const route = response.routes[0];
        
        if (route.summary) {
          setRouteInfo({
            distance: route.summary.distance || 0,
            duration: route.summary.duration || 0,
          });
        }

        const path: Coordinates[] = [];
        if (route.sections) {
          for (const section of route.sections) {
            if (section.roads) {
              for (const road of section.roads) {
                if (road.vertexes) {
                  for (let i = 0; i < road.vertexes.length; i += 2) {
                    path.push({
                      lng: road.vertexes[i],
                      lat: road.vertexes[i + 1],
                    });
                  }
                }
              }
            }
          }
        }
        
        setRoutePath(path);

        // 패널 닫기
        setShowDirections(false);
        setSelectedPlace(null);

        // 사운드 효과 및 걷는 애니메이션
        SoundEffects.playRouteStart();
        startAnimation(path, () => {
          SoundEffects.playRouteComplete();
        });

        if (map && path.length > 0) {
          const bounds = new kakao.maps.LatLngBounds();
          path.forEach(coord => {
            bounds.extend(new kakao.maps.LatLng(coord.lat, coord.lng));
          });
          map.setBounds(bounds);
        }
      } else {
        setDirectionsError('경로를 찾을 수 없습니다.');
        SoundEffects.playError();
      }
    } catch (error) {
      console.error('Failed to get directions:', error);
      setDirectionsError('경로 검색에 실패했습니다.');
      SoundEffects.playError();
    } finally {
      setIsDirectionsLoading(false);
    }
  }, [directionsOrigin, directionsDestination, map, setSelectedPlace, startAnimation, stopAnimation]);

  // Get current category info for header
  const currentCategoryIcon = selectedCategory?.icon || 'food';
  const currentCategoryName = selectedCategory?.name || '검색 결과';

  return (
    <div className="map-page">
      <SkipLink targetId="map-container">지도로 바로가기</SkipLink>

      {/* Navbar */}
      <MapNavbar
        onSearch={handleNavbarSearch}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />

      {/* Main Layout */}
      <div className="map-page-body">
        {/* Category Sidebar (Left) */}
        <CategorySidebar
          selectedCategoryId={selectedCategory?.id || null}
          onCategorySelect={handleCategorySelect}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          popularKeywords={popularKeywords}
          onPopularKeywordClick={(keyword) => {
            search(keyword);
            setSelectedCategory(null);
          }}
        />

        {/* Center Content (Map) */}
        <main className="map-page-main">
          {/* Category Header */}
          <CategoryHeader
            categoryName={currentCategoryName}
            categoryIcon={currentCategoryIcon}
          />

          {/* Map Area */}
          <div className="map-page-map" id="map-container">
            <KakaoMap onMapReady={handleMapReady} />
            
            {isMapReady && (
              <MapControls
                showZoom
                showMyLocation
                showHome
                showFavorites
                showHistory
                showFavoritesFilter
                isFavoritesFilterActive={showOnlyFavorites}
                onHomeClick={handleHomeClick}
                onFavoritesClick={() => setShowFavorites(true)}
                onHistoryClick={() => setShowHistory(true)}
                onFavoritesFilterToggle={handleFavoritesFilterToggle}
              />
            )}

            {/* 커스텀 장소 마커 (클러스터링 적용) */}
            {isMapReady && (
              <PlaceMarkerCluster
                places={placesToShow}
                selectedPlaceId={selectedPlace?.id}
                onPlaceClick={handlePlaceClick}
                minClusterSize={2}
              />
            )}

            {isMapReady && (
              <>
                <HomeMarker />
                <StartFlagMarker />
              </>
            )}

            {routePath.length > 0 && (
              <RoutePolyline
                path={routePath}
                strokeColor="#3b82f6"
                strokeWeight={5}
              />
            )}

            {/* 경로 정보 오버레이 */}
            {routePath.length > 0 && routeInfo && directionsOrigin && directionsDestination && (
              <RouteInfoOverlay
                originName={directionsOrigin.name}
                destinationName={directionsDestination.name}
                duration={routeInfo.duration}
                distance={routeInfo.distance}
                onClose={clearRoute}
              />
            )}

            {!isMapReady && (
              <div className="map-page-map-loading">
                <Loading size="lg" text="지도를 불러오는 중..." />
              </div>
            )}
          </div>
        </main>

        {/* Place List Sidebar (Right) */}
        <PlaceList
          places={searchResults}
          selectedPlaceId={selectedPlace?.id}
          isLoading={isLoading}
          onPlaceClick={handlePlaceClick}
          onDirectionsClick={handleDirections}
        />
      </div>

      {/* Place Detail Modal/Panel */}
      {selectedPlace && (
        <div className="map-page-detail-overlay" onClick={handleClosePlaceDetail}>
          <div className="map-page-detail" onClick={(e) => e.stopPropagation()}>
            <PlaceDetail
              place={selectedPlace}
              isFavorite={checkFavorite(selectedPlace.id)}
              onClose={handleClosePlaceDetail}
              onFavoriteToggle={() => {
                SoundEffects.playClick();
                toggleFavorite(selectedPlace);
              }}
              onDirections={() => handleDirections(selectedPlace)}
            />
          </div>
        </div>
      )}

      {/* Directions Panel */}
      {showDirections && (
        <div className="map-page-directions-overlay" onClick={() => setShowDirections(false)}>
          <div className="map-page-directions" onClick={(e) => e.stopPropagation()}>
            <DirectionsPanel
              origin={directionsOrigin}
              destination={directionsDestination}
              routeInfo={routeInfo}
              isLoading={isDirectionsLoading}
              error={directionsError}
              onOriginChange={setDirectionsOrigin}
              onDestinationChange={setDirectionsDestination}
              onSearch={handleDirectionsSearch}
              onSwap={handleSwapDirections}
              onClose={() => setShowDirections(false)}
            />
          </div>
        </div>
      )}

      {/* Favorites Panel */}
      {showFavorites && (
        <div className="map-page-panel-overlay" onClick={() => setShowFavorites(false)}>
          <div className="map-page-panel" onClick={(e) => e.stopPropagation()}>
            <FavoritesPanel
              favorites={favorites}
              onSelect={handleFavoriteSelect}
              onRemove={handleFavoriteRemove}
              onClose={() => setShowFavorites(false)}
            />
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="map-page-panel-overlay" onClick={() => setShowHistory(false)}>
          <div className="map-page-panel" onClick={(e) => e.stopPropagation()}>
            <HistoryPanel
              history={history}
              onSelect={handleHistorySelect}
              onClearAll={handleClearHistory}
              onClose={() => setShowHistory(false)}
            />
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer />

      {/* Sound Toggle */}
      <SoundToggle />

      {/* Modals */}
      <HomeSettingModal />
      <RouteStartModal />
    </div>
  );
};

export default MapPage;
