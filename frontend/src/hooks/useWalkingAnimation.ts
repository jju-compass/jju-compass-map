import { useRef, useCallback, useEffect } from 'react';
import { useMapStore } from '../store/mapStore';
import type { Coordinates } from '../types';

interface WalkingAnimationState {
  isAnimating: boolean;
  walkerPosition: Coordinates | null;
  progress: number; // 0 ~ 1
  distance: number; // meters
  duration: number; // minutes
}

interface UseWalkingAnimationReturn {
  state: WalkingAnimationState;
  startAnimation: (path: Coordinates[], onComplete?: () => void) => void;
  stopAnimation: () => void;
  walkerOverlayRef: React.MutableRefObject<kakao.maps.CustomOverlay | null>;
  footstepsRef: React.MutableRefObject<kakao.maps.CustomOverlay[]>;
}

/**
 * 도보 경로 애니메이션 훅
 * - 워커 마커를 경로를 따라 이동시킴
 * - 발자국 트레일 효과
 * - 진행률 및 경로 정보 제공
 */
export function useWalkingAnimation(): UseWalkingAnimationReturn {
  const { map } = useMapStore();
  
  const animationFrameRef = useRef<number | null>(null);
  const walkerOverlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const footstepsRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const stateRef = useRef<WalkingAnimationState>({
    isAnimating: false,
    walkerPosition: null,
    progress: 0,
    distance: 0,
    duration: 0,
  });

  // Haversine distance
  const calculateDistance = useCallback((path: Coordinates[]): number => {
    if (path.length < 2) return 0;
    
    const R = 6371000; // meters
    let total = 0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const lat1 = (path[i].lat * Math.PI) / 180;
      const lat2 = (path[i + 1].lat * Math.PI) / 180;
      const dLat = lat2 - lat1;
      const dLng = ((path[i + 1].lng - path[i].lng) * Math.PI) / 180;
      
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    
    return total;
  }, []);

  // Linear interpolation
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Interpolate position along path
  const getPositionAtProgress = useCallback(
    (path: Coordinates[], t: number): Coordinates => {
      if (path.length < 2) return path[0];
      
      const segCount = path.length - 1;
      const ft = t * segCount;
      const i = Math.min(segCount - 1, Math.floor(ft));
      const localT = ft - i;
      
      return {
        lat: lerp(path[i].lat, path[i + 1].lat, localT),
        lng: lerp(path[i].lng, path[i + 1].lng, localT),
      };
    },
    []
  );

  // Create walker overlay
  const createWalkerOverlay = useCallback((position: Coordinates) => {
    if (!map) return null;

    const el = document.createElement('div');
    el.className = 'walker-avatar';
    el.style.fontSize = '40px';
    el.style.lineHeight = '1';
    el.textContent = '\u{1F6B6}\u{200D}\u{2642}\u{FE0F}'; // 🚶‍♂️
    el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
    el.style.transition = 'transform 0.1s ease-out';

    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(position.lat, position.lng),
      content: el,
      yAnchor: 0.5,
      zIndex: 7,
    });
    overlay.setMap(map);
    
    return overlay;
  }, [map]);

  // Create footstep trail
  const createFootstep = useCallback((position: Coordinates) => {
    if (!map) return null;

    const div = document.createElement('div');
    div.className = 'footstep-trail';

    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(position.lat, position.lng),
      content: div,
      yAnchor: 0.5,
      zIndex: 2,
    });
    overlay.setMap(map);

    // Remove after animation
    setTimeout(() => {
      overlay.setMap(null);
      footstepsRef.current = footstepsRef.current.filter((f) => f !== overlay);
    }, 1200);

    return overlay;
  }, [map]);

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear walker
    if (walkerOverlayRef.current) {
      walkerOverlayRef.current.setMap(null);
      walkerOverlayRef.current = null;
    }

    // Clear footsteps
    footstepsRef.current.forEach((f) => f.setMap(null));
    footstepsRef.current = [];

    stateRef.current = {
      isAnimating: false,
      walkerPosition: null,
      progress: 0,
      distance: 0,
      duration: 0,
    };
  }, []);

  // Start animation
  const startAnimation = useCallback(
    (path: Coordinates[], onComplete?: () => void) => {
      if (!map || path.length < 2) return;

      // Stop existing animation
      stopAnimation();

      // Calculate distance and duration
      const distance = calculateDistance(path);
      const speed = 1.25 * 40; // 50m/s (fast animation)
      const animDuration = Math.max(300, Math.min(2000, (distance / speed) * 1000));
      const walkTimeMinutes = Math.ceil(distance / ((4 * 1000) / 60)); // 4km/h

      stateRef.current = {
        isAnimating: true,
        walkerPosition: path[0],
        progress: 0,
        distance,
        duration: walkTimeMinutes,
      };

      // Create walker
      walkerOverlayRef.current = createWalkerOverlay(path[0]);

      let startTime: number | null = null;
      let lastFootstepTime = 0;
      const footstepInterval = 300;

      const step = (now: number) => {
        if (!stateRef.current.isAnimating) return;

        if (startTime === null) {
          startTime = now;
        }

        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / animDuration);
        const pos = getPositionAtProgress(path, t);

        // Update walker position
        if (walkerOverlayRef.current) {
          walkerOverlayRef.current.setPosition(
            new kakao.maps.LatLng(pos.lat, pos.lng)
          );
        }

        // Create footstep trail
        if (elapsed - lastFootstepTime > footstepInterval && t < 0.98) {
          const footstep = createFootstep(pos);
          if (footstep) {
            footstepsRef.current.push(footstep);
          }
          lastFootstepTime = elapsed;
        }

        // Update state
        stateRef.current = {
          ...stateRef.current,
          walkerPosition: pos,
          progress: t,
        };

        if (t < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          // Animation complete
          stateRef.current.isAnimating = false;

          // Bounce effect on arrival
          if (walkerOverlayRef.current) {
            const content = walkerOverlayRef.current.getContent() as HTMLElement;
            if (content) {
              content.style.animation = 'bounce-marker 0.4s ease-out';
            }
          }

          if (onComplete) {
            onComplete();
          }
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);

      // Fit map to path
      const bounds = new kakao.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)));
      map.setBounds(bounds, 40, 40, 40, 40);
    },
    [map, stopAnimation, calculateDistance, getPositionAtProgress, createWalkerOverlay, createFootstep]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    state: stateRef.current,
    startAnimation,
    stopAnimation,
    walkerOverlayRef,
    footstepsRef,
  };
}

export default useWalkingAnimation;
