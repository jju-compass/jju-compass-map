import React, { useEffect, useRef } from 'react';
import { useMapStore } from '../../../store';
import { useRouteStore } from '../../../store/routeStore';
import './CustomMarkers.css';

/**
 * 홈 마커 컴포넌트
 */
export const HomeMarker: React.FC = () => {
  const { map } = useMapStore();
  const { homePosition } = useRouteStore();
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);

  useEffect(() => {
    if (!map || !homePosition) {
      // 마커 제거
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
      return;
    }

    // 마커 생성
    const el = document.createElement('div');
    el.className = 'home-marker';
    el.innerHTML = `
      <div class="home-icon">🏠</div>
      <div class="home-pulse"></div>
    `;

    const position = new kakao.maps.LatLng(homePosition.lat, homePosition.lng);

    if (overlayRef.current) {
      overlayRef.current.setPosition(position);
      overlayRef.current.setContent(el);
    } else {
      overlayRef.current = new kakao.maps.CustomOverlay({
        position,
        content: el,
        yAnchor: 1,
        zIndex: 5,
      });
      overlayRef.current.setMap(map);
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, homePosition]);

  return null;
};

/**
 * 출발지 깃발 마커 컴포넌트
 */
export const StartFlagMarker: React.FC = () => {
  const { map } = useMapStore();
  const { startPosition } = useRouteStore();
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);

  useEffect(() => {
    if (!map || !startPosition) {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
      return;
    }

    const el = document.createElement('div');
    el.className = 'start-flag-marker';
    el.innerHTML = `
      <div class="flag-pole"></div>
      <div class="flag-icon">🚩</div>
    `;

    const position = new kakao.maps.LatLng(startPosition.lat, startPosition.lng);

    if (overlayRef.current) {
      overlayRef.current.setPosition(position);
      overlayRef.current.setContent(el);
    } else {
      overlayRef.current = new kakao.maps.CustomOverlay({
        position,
        content: el,
        yAnchor: 1,
        zIndex: 6,
      });
      overlayRef.current.setMap(map);
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, startPosition]);

  return null;
};

export default { HomeMarker, StartFlagMarker };
