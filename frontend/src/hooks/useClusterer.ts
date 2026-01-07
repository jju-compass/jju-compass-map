import { useCallback, useRef, useEffect } from 'react';
import { useMapStore } from '../store';

/**
 * 마커 클러스터러 3단계 스타일
 * - 파란색 (10개 미만): 작은 클러스터
 * - 주황색 (10~30개): 중간 클러스터
 * - 빨간색 (30개 이상): 큰 클러스터
 */
const clusterStyles: kakao.maps.ClusterStyle[] = [
  // 작은 클러스터 (10개 미만)
  {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #4c6ef5 0%, #3b5bdb 100%)',
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: '40px',
    fontSize: '14px',
    boxShadow: '0 2px 8px rgba(76, 110, 245, 0.4)',
  },
  // 중간 클러스터 (10~30개)
  {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #f59f00 0%, #e67700 100%)',
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: '50px',
    fontSize: '15px',
    boxShadow: '0 2px 10px rgba(245, 159, 0, 0.4)',
  },
  // 큰 클러스터 (30개 이상)
  {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #fa5252 0%, #e03131 100%)',
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: '60px',
    fontSize: '16px',
    boxShadow: '0 3px 12px rgba(250, 82, 82, 0.4)',
  },
];

/**
 * 클러스터 단계 계산기
 * - 1~9개: 스타일 0 (파란색)
 * - 10~29개: 스타일 1 (주황색)
 * - 30개 이상: 스타일 2 (빨간색)
 */
const clusterCalculator = (count: number): number => {
  if (count < 10) return 0;
  if (count < 30) return 1;
  return 2;
};

export interface UseClustererOptions {
  gridSize?: number;
  minLevel?: number;
  disableClickZoom?: boolean;
}

export function useClusterer(options: UseClustererOptions = {}) {
  const { map } = useMapStore();
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);

  const { gridSize = 60, minLevel = 5, disableClickZoom = false } = options;

  /**
   * 클러스터러 초기화
   */
  const initClusterer = useCallback(() => {
    if (!map) return;

    // MarkerClusterer 라이브러리 확인
    if (typeof kakao === 'undefined' || !kakao.maps.MarkerClusterer) {
      console.warn('[Clusterer] MarkerClusterer 라이브러리가 로드되지 않았습니다.');
      return;
    }

    // 기존 클러스터러 제거
    if (clustererRef.current) {
      clustererRef.current.clear();
    }

    // 새 클러스터러 생성
    clustererRef.current = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel,
      disableClickZoom,
      styles: clusterStyles,
      gridSize,
      calculator: clusterCalculator,
    });

    console.log('[Clusterer] 마커 클러스터러 초기화 완료');
  }, [map, gridSize, minLevel, disableClickZoom]);

  /**
   * 마커 추가
   */
  const addMarkers = useCallback((markers: kakao.maps.Marker[]) => {
    if (!clustererRef.current) {
      initClusterer();
    }

    if (clustererRef.current) {
      // 기존 마커들 제거
      clustererRef.current.clear();
      markersRef.current = markers;
      // 새 마커들 추가
      clustererRef.current.addMarkers(markers);
    }
  }, [initClusterer]);

  /**
   * 마커 제거
   */
  const removeMarkers = useCallback((markers: kakao.maps.Marker[]) => {
    if (clustererRef.current) {
      clustererRef.current.removeMarkers(markers);
      markersRef.current = markersRef.current.filter(m => !markers.includes(m));
    }
  }, []);

  /**
   * 모든 마커 제거
   */
  const clearMarkers = useCallback(() => {
    if (clustererRef.current) {
      clustererRef.current.clear();
      markersRef.current = [];
    }
  }, []);

  /**
   * 클러스터러 재그리기
   */
  const redraw = useCallback(() => {
    if (clustererRef.current) {
      clustererRef.current.redraw();
    }
  }, []);

  // 맵 변경 시 클러스터러 재초기화
  useEffect(() => {
    if (map) {
      initClusterer();
      // 기존 마커가 있으면 다시 추가
      if (markersRef.current.length > 0) {
        clustererRef.current?.addMarkers(markersRef.current);
      }
    }

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clear();
        clustererRef.current = null;
      }
    };
  }, [map, initClusterer]);

  return {
    clusterer: clustererRef.current,
    addMarkers,
    removeMarkers,
    clearMarkers,
    redraw,
    initClusterer,
  };
}

export default useClusterer;
