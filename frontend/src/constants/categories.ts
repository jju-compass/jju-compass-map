/**
 * JJU Compass Map - 카테고리 시스템
 * 지도 기본 설정 정의
 */

// ============================================
// 지도 기본 설정
// ============================================
export const mapConfig = {
  // 전주대학교 정문 좌표
  center: {
    lat: 35.814445811028584,
    lng: 127.09236571436321,
  },
  // 기본 줌 레벨
  defaultLevel: 4,
  // 검색 반경 (미터)
  searchRadius: 2000,
  // 한 페이지당 최대 결과 수
  pageSize: 15,
  // 최대 페이지 수
  maxPages: 3,
  // 지도 이동 제한 범위 (미터) - 캠퍼스 중심에서 4km
  maxDistanceFromCenter: 4000,
  // 줌 레벨 제한
  minZoomLevel: 1, // 최대 확대
  maxZoomLevel: 7, // 최대 축소
};
