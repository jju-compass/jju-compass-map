import { useEffect, useRef } from 'react';
import { useMapStore } from '@store/mapStore';
import type { Place } from '../../../types';

export interface MapMarkerProps {
  place: Place;
  isSelected?: boolean;
  onClick?: (place: Place) => void;
  showInfoWindow?: boolean;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  place,
  isSelected = false,
  onClick,
  showInfoWindow = false,
}) => {
  const markerRef = useRef<kakao.maps.Marker | null>(null);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  const { map } = useMapStore();

  // Kakao API returns coordinates as strings (x=lng, y=lat)
  const lat = parseFloat(place.y);
  const lng = parseFloat(place.x);

  // Create marker
  useEffect(() => {
    if (!map || isNaN(lat) || isNaN(lng)) return;

    const position = new kakao.maps.LatLng(lat, lng);
    
    const marker = new kakao.maps.Marker({
      position,
      map,
      title: place.place_name,
    });

    markerRef.current = marker;

    // Click handler
    if (onClick) {
      kakao.maps.event.addListener(marker, 'click', () => {
        onClick(place);
      });
    }

    return () => {
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [map, lat, lng, place.place_name, onClick, place]);

  // Handle selection state - update marker appearance
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    // Could change marker image based on selection state
    // For now, we'll handle this through the info window
    if (isSelected) {
      marker.setZIndex(10);
    } else {
      marker.setZIndex(1);
    }
  }, [isSelected]);

  // Info window
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !map) return;

    if (showInfoWindow || isSelected) {
      const address = place.road_address_name || place.address_name;
      const content = `
        <div class="marker-info-window">
          <div class="marker-info-name">${place.place_name}</div>
          ${address ? `<div class="marker-info-address">${address}</div>` : ''}
        </div>
      `;

      const infoWindow = new kakao.maps.InfoWindow({
        content,
        removable: false,
      });

      infoWindow.open(map, marker);
      infoWindowRef.current = infoWindow;

      return () => {
        infoWindow.close();
        infoWindowRef.current = null;
      };
    }
  }, [map, showInfoWindow, isSelected, place.place_name, place.road_address_name, place.address_name]);

  // This component doesn't render anything to the DOM directly
  // It manages Kakao Maps marker objects
  return null;
};

export default MapMarker;
