import React, { useState, useCallback, useEffect } from 'react';
import { KakaoMap, MapMarker, MapControls } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { PlaceDetail, FavoritesPanel, HistoryPanel } from './components/panels';
import { DirectionsPanel, RoutePolyline } from './components/directions';
import type { TransportMode } from './components/directions/DirectionsPanel/DirectionsPanel';
import { Loading, ToastContainer } from './components/common';
import { useMapStore } from './store/mapStore';
import { useUserStore } from './store/userStore';
import { useFavorites } from './hooks/useFavorites';
import { useHistory } from './hooks/useHistory';
import { directionsAPI } from './api';
import type { Place, Favorite, Coordinates, RouteInfo } from './types';
import './App.css';

type ActiveView = 'search' | 'favorites' | 'history' | 'directions' | null;

const App: React.FC = () => {
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

  // Load initial data on mount
  useEffect(() => {
    loadFavorites();
    loadHistory();
    loadPopularKeywords();
  }, [loadFavorites, loadHistory, loadPopularKeywords]);

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
    <div className="app">
      {/* Sidebar */}
      <Sidebar
        className="app-sidebar"
        onPlaceSelect={handlePlaceSelect}
        onDirections={handleDirections}
      />

      {/* Main Content */}
      <main className="app-main">
        {/* Map */}
        <div className="app-map">
          <KakaoMap onMapReady={handleMapReady} />
          
          {/* Map Controls */}
          {isMapReady && (
            <MapControls
              showZoom
              showMyLocation
              showHome={false}
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
            <div className="app-map-loading">
              <Loading size="lg" text="지도를 불러오는 중..." />
            </div>
          )}
        </div>

        {/* Place Detail Panel */}
        {selectedPlace && (
          <div className="app-place-detail">
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
        <div className="app-panel">
          <FavoritesPanel
            favorites={favorites}
            onSelect={handleFavoriteSelect}
            onClose={() => setActiveView('search')}
          />
        </div>
      )}

      {activeView === 'history' && (
        <div className="app-panel">
          <HistoryPanel
            history={history}
            onSelect={handleHistorySelect}
            onClose={() => setActiveView('search')}
          />
        </div>
      )}

      {activeView === 'directions' && (
        <div className="app-panel">
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
      <nav className="app-nav">
        <button
          className={`app-nav-item ${activeView === 'search' ? 'active' : ''}`}
          onClick={() => setActiveView('search')}
        >
          <span className="app-nav-icon">🔍</span>
          <span className="app-nav-label">검색</span>
        </button>
        <button
          className={`app-nav-item ${activeView === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveView('favorites')}
        >
          <span className="app-nav-icon">⭐</span>
          <span className="app-nav-label">즐겨찾기</span>
        </button>
        <button
          className={`app-nav-item ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          <span className="app-nav-icon">🕐</span>
          <span className="app-nav-label">기록</span>
        </button>
        <button
          className={`app-nav-item ${activeView === 'directions' ? 'active' : ''}`}
          onClick={() => setActiveView('directions')}
        >
          <span className="app-nav-icon">🧭</span>
          <span className="app-nav-label">길찾기</span>
        </button>
      </nav>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default App;
