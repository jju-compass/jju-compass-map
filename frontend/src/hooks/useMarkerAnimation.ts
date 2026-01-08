import { useCallback, useRef } from 'react';

/**
 * 선형 보간
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Easing function - easeOutCubic
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 미터를 위도 변화량으로 변환 (근사값)
 */
function metersToDeltaLat(meters: number): number {
  return meters / 111320;
}

/**
 * 마커 애니메이션 훅
 */
export function useMarkerAnimation() {
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Drop 애니메이션 - 마커가 위에서 떨어지는 효과
   */
  const dropMarker = useCallback((
    marker: kakao.maps.Marker,
    targetPos: kakao.maps.LatLng,
    duration = 700,
    offsetMeters = 40
  ) => {
    try {
      const startLat = targetPos.getLat() + metersToDeltaLat(offsetMeters);
      const startLng = targetPos.getLng();
      const start = performance.now();

      function step(now: number) {
        const t = Math.min(1, (now - start) / duration);
        const e = easeOutCubic(t);
        const curLat = lerp(startLat, targetPos.getLat(), e);
        const curLng = lerp(startLng, targetPos.getLng(), e);
        marker.setPosition(new kakao.maps.LatLng(curLat, curLng));
        
        if (t < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          marker.setPosition(targetPos);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(step);
    } catch (e) {
      marker.setPosition(targetPos);
    }
  }, []);

  /**
   * Bounce 애니메이션 - 마커가 통통 튀는 효과
   */
  const bounceMarker = useCallback((
    marker: kakao.maps.Marker,
    heightMeters = 20,
    duration = 700
  ) => {
    const originPos = marker.getPosition();
    const originLat = originPos.getLat();
    const originLng = originPos.getLng();
    const amp = metersToDeltaLat(heightMeters);
    const start = performance.now();

    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const bounces = 2.5; // 튀는 횟수
      const envelope = 1 - t; // 서서히 감소
      const offset = Math.abs(Math.sin(t * Math.PI * bounces)) * amp * envelope;
      const curLat = originLat + offset;
      marker.setPosition(new kakao.maps.LatLng(curLat, originLng));
      
      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        marker.setPosition(originPos);
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(step);
  }, []);

  /**
   * Ripple 효과 - 클릭 시 물결 효과 (CustomOverlay 사용)
   */
  const showRipple = useCallback((
    map: kakao.maps.Map,
    position: kakao.maps.LatLng,
    color = '#4CAF50'
  ) => {
    const div = document.createElement('div');
    div.className = 'kmap-ripple';
    div.style.cssText = `
      width: 60px;
      height: 60px;
      border: 3px solid ${color};
      border-radius: 50%;
      background-color: ${color}33;
      opacity: 1;
      animation: ripple-expand 0.6s ease-out forwards;
      pointer-events: none;
      position: absolute;
      transform: translate(-50%, -50%);
    `;

    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: div,
      yAnchor: 0.5,
      zIndex: 3,
    });
    
    overlay.setMap(map);

    // 애니메이션 후 제거
    setTimeout(() => {
      overlay.setMap(null);
    }, 650);

    return overlay;
  }, []);

  /**
   * 애니메이션 취소
   */
  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  return {
    dropMarker,
    bounceMarker,
    showRipple,
    cancelAnimation,
  };
}

export default useMarkerAnimation;
