import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KakaoMap,
  MapMarker,
  MapControls,
  MapNavbar,
  CategorySidebar,
  CategoryHeader,
  PlaceList,
  categoryData,
  type Category,
} from '../../components/Map';
import { HomeMarker, StartFlagMarker } from '../../components/Map/CustomMarkers';
import { PlaceDetail } from '../../components/panels';
import { DirectionsPanel, RoutePolyline } from '../../components/directions';
import type { TransportMode } from '../../components/directions/DirectionsPanel/DirectionsPanel';
import { Loading, ToastContainer, SoundToggle, SkipLink } from '../../components/common';
import { HomeSettingModal, RouteStartModal } from '../../components/modals';
import { useMapStore } from '../../store/mapStore';
import { useUserStore } from '../../store/userStore';
import { useRouteStore } from '../../store/routeStore';
import { useFavorites } from '../../hooks/useFavorites';
import { useHistory } from '../../hooks/useHistory';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardAccessibility';
import { useSearch } from '../../hooks/useSearch';
import { directionsAPI } from '../../api';
import { toast } from '../../store/toastStore';
import type { Place, Coordinates, RouteInfo } from '../../types';
import './MapPage.css';

const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  
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
  } = useMapStore();

  const { favorites } = useUserStore();
  const { search } = useSearch();
  const { toggleFavorite, checkFavorite, loadFavorites } = useFavorites();
  const { loadHistory, loadPopularKeywords } = useHistory();

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
    }, [selectedPlace, showDirections, isSidebarOpen, setHomeModalOpen, setSelectedPlace]),
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

  // Handle navbar search
  const handleNavbarSearch = useCallback((keyword: string) => {
    search(keyword);
    setSelectedCategory(null);
  }, [search]);

  // Handle category selection
  const handleCategorySelect = useCallback((category: Category) => {
    setSelectedCategory(category);
    search(category.searchKeyword);
    setIsSidebarOpen(false);
  }, [search]);

  // Handle place selection from list
  const handlePlaceClick = useCallback((place: Place) => {
    setSelectedPlace(place);
    
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    if (!isNaN(lat) && !isNaN(lng) && map) {
      map.panTo(new kakao.maps.LatLng(lat, lng));
    }
  }, [map, setSelectedPlace]);

  // Handle directions request
  const handleDirections = useCallback((place: Place) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);
    
    setDirectionsDestination({
      name: place.place_name,
      coordinates: { lat, lng },
      place,
    });

    if (currentLocation) {
      setDirectionsOrigin({
        name: '현재 위치',
        coordinates: currentLocation,
      });
    }

    setShowDirections(true);
  }, [currentLocation]);

  // Handle closing place detail
  const handleClosePlaceDetail = useCallback(() => {
    setSelectedPlace(null);
  }, [setSelectedPlace]);

  // Use current location for directions
  const handleUseCurrentLocation = useCallback(() => {
    if (currentLocation) {
      setDirectionsOrigin({
        name: '현재 위치',
        coordinates: currentLocation,
      });
    }
  }, [currentLocation]);

  // Swap origin and destination
  const handleSwapDirections = useCallback(() => {
    const temp = directionsOrigin;
    setDirectionsOrigin(directionsDestination);
    setDirectionsDestination(temp);
  }, [directionsOrigin, directionsDestination]);

  // Handle directions search
  const handleDirectionsSearch = useCallback(async (mode: TransportMode) => {
    if (!directionsOrigin || !directionsDestination) return;

    setIsDirectionsLoading(true);
    setDirectionsError(null);
    setRoutePath([]);
    setRouteInfo(null);

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

        if (map && path.length > 0) {
          const bounds = new kakao.maps.LatLngBounds();
          path.forEach(coord => {
            bounds.extend(new kakao.maps.LatLng(coord.lat, coord.lng));
          });
          map.setBounds(bounds);
        }
      } else {
        setDirectionsError('경로를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to get directions:', error);
      setDirectionsError('경로 검색에 실패했습니다.');
    } finally {
      setIsDirectionsLoading(false);
    }
  }, [directionsOrigin, directionsDestination, map]);

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
                onHomeClick={handleHomeClick}
              />
            )}

            {isMapReady && searchResults.map((place) => (
              <MapMarker
                key={place.id}
                place={place}
                isSelected={selectedPlace?.id === place.id}
                onClick={handlePlaceClick}
              />
            ))}

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
              onFavoriteToggle={() => toggleFavorite(selectedPlace)}
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
              onUseCurrentLocation={handleUseCurrentLocation}
              onClose={() => setShowDirections(false)}
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
