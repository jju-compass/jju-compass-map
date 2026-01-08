import { useEffect, useRef } from 'react';
import { useMapStore } from '@store/mapStore';
import type { Coordinates } from '../../../types';

export interface RoutePolylineProps {
  path: Coordinates[];
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeStyle?: 'solid' | 'dash' | 'dot';
  visible?: boolean;
}

export const RoutePolyline: React.FC<RoutePolylineProps> = ({
  path,
  strokeColor = '#3b82f6',
  strokeWeight = 5,
  strokeOpacity = 0.8,
  strokeStyle = 'solid',
  visible = true,
}) => {
  const polylineRef = useRef<kakao.maps.Polyline | null>(null);
  const { map } = useMapStore();

  // Create/update polyline
  useEffect(() => {
    if (!map || path.length < 2) {
      // Clean up if path is too short
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    // Convert coordinates to LatLng
    const linePath = path.map(
      (coord) => new kakao.maps.LatLng(coord.lat, coord.lng)
    );

    // Create polyline if not exists
    if (!polylineRef.current) {
      const polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight,
        strokeColor,
        strokeOpacity,
        strokeStyle: strokeStyle as kakao.maps.StrokeStyles,
      });
      polylineRef.current = polyline;
    } else {
      // Update existing polyline
      polylineRef.current.setPath(linePath);
      polylineRef.current.setOptions({
        strokeWeight,
        strokeColor,
        strokeOpacity,
        strokeStyle: strokeStyle as kakao.maps.StrokeStyles,
      });
    }

    // Set visibility
    polylineRef.current.setMap(visible ? map : null);

    // Cleanup
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, path, strokeColor, strokeWeight, strokeOpacity, strokeStyle, visible]);

  // Handle visibility changes
  useEffect(() => {
    if (!polylineRef.current || !map) return;
    polylineRef.current.setMap(visible ? map : null);
  }, [visible, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  // This component doesn't render anything to the DOM directly
  return null;
};

export default RoutePolyline;
