import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KakaoMap, MapMarker, MapControls } from '../../components/Map';
import { HomeMarker, StartFlagMarker } from '../../components/Map/CustomMarkers';
import { Sidebar } from '../../components/Sidebar';
import { PlaceDetail, FavoritesPanel, HistoryPanel } from '../../components/panels';
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
import { directionsAPI } from '../../api';
import { toast } from '../../store/toastStore';
import type { Place, Favorite, Coordinates, RouteInfo } from '../../types';
import './MapPage.css';

type ActiveView = 'search' | 'favorites' | 'history' | 'directions' | null;

const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState<ActiveView>('search');
  const [isMapReady, setIsMapReady] = useState(false);
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
    setCenter,
  } = useMapStore();

  const {
    favorites,
    history,
    searchKeyword,
  } = useUserStore();

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

  // Handle home button click
  const handleHomeClick = useCallback(() => {
    setHomeModalOpen(true);
  }, [setHomeModalOpen]);

  // Keyboard shortcuts (ESC to close modals/panels)
  useKeyboardShortcuts({
    onEscape: useCallback(() => {
      // 모달 닫기
      if (useRouteStore.getState().isHomeModalOpen) {
        setHomeModalOpen(false);
        return;
      }
      if (useRouteStore.getState().isRouteModalOpen) {
        useRouteStore.getState().setRouteModalOpen(false);
        return;
      }
      // 상세 패널 닫기
      if (selectedPlace) {
        setSelectedPlace(null);
        return;
      }
      // 패널 닫기
      if (activeView !== 'search') {
        setActiveView('search');
      }
    }, [selectedPlace, activeView, setHomeModalOpen, setSelectedPlace]),
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
  const handleMapReady = useCallback((mapInstance: kakao.maps.Map) => {
    setIsMapReady(true);
    console.log('Map initialized');
  }, []);

  // Handle place selection from search results
  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlace(place);
    
    // Move map to selected place
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

    // Use current location as origin if available
    if (currentLocation) {
      setDirectionsOrigin({
        name: '현재 위치',
        coordinates: currentLocation,
      });
    }

    setActiveView('directions');
  }, [currentLocation]);

  // Handle favorite selection
  const handleFavoriteSelect = useCallback((favorite: Favorite) => {
    if (map) {
      map.panTo(new kakao.maps.LatLng(favorite.lat, favorite.lng));
    }
    setActiveView('search');
  }, [map]);

  // Handle history keyword selection
  const handleHistorySelect = useCallback((keyword: string) => {
    // This will trigger a new search
    setActiveView('search');
    // The search will be handled by the Sidebar component
  }, []);

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
        
        // Extract route info
        if (route.summary) {
          setRouteInfo({
            distance: route.summary.distance || 0,
            duration: route.summary.duration || 0,
          });
        }

        // Extract route path from vertexes
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

        // Fit map bounds to route
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

  return (
    <div className="map-page">
      {/* Skip Link for accessibility */}
      <SkipLink targetId="map">지도로 바로가기</SkipLink>

      {/* Sidebar */}
      <Sidebar
        className="map-page-sidebar"
        onPlaceSelect={handlePlaceSelect}
        onDirections={handleDirections}
        initialSearchKeyword={categoryParam || undefined}
      />

      {/* Main Content */}
      <main className="map-page-main">
        {/* Map */}
        <div className="map-page-map" id="map">
          <KakaoMap onMapReady={handleMapReady} />
          
          {/* Map Controls */}
          {isMapReady && (
            <MapControls
              showZoom
              showMyLocation
              showHome
              onHomeClick={handleHomeClick}
            />
          )}

          {/* Search Result Markers */}
          {isMapReady && searchResults.map((place) => (
            <MapMarker
              key={place.id}
              place={place}
              isSelected={selectedPlace?.id === place.id}
              onClick={handlePlaceSelect}
            />
          ))}

          {/* Custom Markers (Home, Start Flag) */}
          {isMapReady && (
            <>
              <HomeMarker />
              <StartFlagMarker />
            </>
          )}

          {/* Route Polyline */}
          {routePath.length > 0 && (
            <RoutePolyline
              path={routePath}
              strokeColor="#3b82f6"
              strokeWeight={5}
            />
          )}

          {/* Loading Overlay */}
          {!isMapReady && (
            <div className="map-page-map-loading">
              <Loading size="lg" text="지도를 불러오는 중..." />
            </div>
          )}
        </div>

        {/* Place Detail Panel */}
        {selectedPlace && (
          <div className="map-page-place-detail">
            <PlaceDetail
              place={selectedPlace}
              isFavorite={checkFavorite(selectedPlace.id)}
              onClose={handleClosePlaceDetail}
              onFavoriteToggle={() => toggleFavorite(selectedPlace)}
              onDirections={() => handleDirections(selectedPlace)}
            />
          </div>
        )}
      </main>

      {/* Side Panels */}
      {activeView === 'favorites' && (
        <div className="map-page-panel">
          <FavoritesPanel
            favorites={favorites}
            onSelect={handleFavoriteSelect}
            onClose={() => setActiveView('search')}
          />
        </div>
      )}

      {activeView === 'history' && (
        <div className="map-page-panel">
          <HistoryPanel
            history={history}
            onSelect={handleHistorySelect}
            onClose={() => setActiveView('search')}
          />
        </div>
      )}

      {activeView === 'directions' && (
        <div className="map-page-panel">
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
            onClose={() => setActiveView('search')}
          />
        </div>
      )}

      {/* Bottom Navigation (Mobile) */}
      <nav className="map-page-nav">
        <button
          className={`map-page-nav-item ${activeView === 'search' ? 'active' : ''}`}
          onClick={() => setActiveView('search')}
        >
          <span className="map-page-nav-icon">🔍</span>
          <span className="map-page-nav-label">검색</span>
        </button>
        <button
          className={`map-page-nav-item ${activeView === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveView('favorites')}
        >
          <span className="map-page-nav-icon">⭐</span>
          <span className="map-page-nav-label">즐겨찾기</span>
        </button>
        <button
          className={`map-page-nav-item ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <span className="map-page-nav-icon">🕐</span>
          <span className="map-page-nav-label">기록</span>
        </button>
        <button
          className={`map-page-nav-item ${activeView === 'directions' ? 'active' : ''}`}
          onClick={() => setActiveView('directions')}
        >
          <span className="map-page-nav-icon">🧭</span>
          <span className="map-page-nav-label">길찾기</span>
        </button>
      </nav>

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
