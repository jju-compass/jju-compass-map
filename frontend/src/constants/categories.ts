/**
 * JJU Compass Map - 카테고리 시스템
 * 카테고리 정보, 색상 테마, 사이드바 구조 정의
 */

// ============================================
// 카테고리 정보 (아이콘, 제목, 설명)
// ============================================
export interface CategoryInfo {
  icon: string;
  title: string;
  desc: string;
}

export const categoryInfo: Record<string, CategoryInfo> = {
  '전체음식점': { icon: '🍽️', title: '전체 음식점', desc: '주변의 모든 음식점을 확인하세요' },
  '한식': { icon: '🍚', title: '한식', desc: '주변의 한식당을 확인하세요' },
  '중식': { icon: '🥟', title: '중식', desc: '주변의 중식당을 확인하세요' },
  '일식': { icon: '🍣', title: '일식', desc: '주변의 일식당을 확인하세요' },
  '양식': { icon: '🍕', title: '양식', desc: '주변의 양식당을 확인하세요' },
  '분식': { icon: '🍢', title: '분식', desc: '주변의 분식집을 확인하세요' },
  '카페': { icon: '☕', title: '카페', desc: '주변의 카페를 확인하세요' },
  '편의점': { icon: '🏪', title: '편의점', desc: '주변의 편의점을 확인하세요' },
  '약국': { icon: '💊', title: '약국', desc: '주변의 약국을 확인하세요' },
  '병원': { icon: '🏥', title: '병원', desc: '주변의 병원을 확인하세요' },
  '은행': { icon: '🏦', title: '은행/ATM', desc: '주변의 은행과 ATM을 확인하세요' },
  '문구점': { icon: '✏️', title: '문구점', desc: '주변의 문구점을 확인하세요' },
  '미용실': { icon: '💇', title: '미용실', desc: '주변의 미용실을 확인하세요' },
  'PC방': { icon: '💻', title: 'PC방', desc: '주변의 PC방을 확인하세요' },
  '헬스장': { icon: '💪', title: '헬스장', desc: '주변의 헬스장을 확인하세요' },
  '노래방': { icon: '🎤', title: '노래방', desc: '주변의 노래방을 확인하세요' },
};

// ============================================
// 카테고리별 색상 테마
// ============================================
export interface CategoryColor {
  primary: string;
  bg: string;
  border: string;
}

export const categoryColors: Record<string, CategoryColor> = {
  // 음식점
  '한식': { primary: '#ff8c42', bg: '#fff8f3', border: '#ffe4cc' },
  '중식': { primary: '#e63946', bg: '#fff5f5', border: '#ffc9c9' },
  '일식': { primary: '#f4a261', bg: '#fffaf5', border: '#ffe0c2' },
  '양식': { primary: '#2a9d8f', bg: '#f0fdf9', border: '#b2f2e8' },
  '분식': { primary: '#f4d35e', bg: '#fffef5', border: '#fff3b0' },
  '카페': { primary: '#8b5a2b', bg: '#faf6f2', border: '#e8d5c4' },
  // 편의시설
  '편의점': { primary: '#4c6ef5', bg: '#f3f6ff', border: '#c5d4ff' },
  '약국': { primary: '#20c997', bg: '#f0fdf4', border: '#b2f2d8' },
  '병원': { primary: '#fa5252', bg: '#fff5f5', border: '#ffc9c9' },
  '은행': { primary: '#364fc7', bg: '#f0f3ff', border: '#bac8ff' },
  '문구점': { primary: '#7950f2', bg: '#f8f5ff', border: '#d0bfff' },
  '미용실': { primary: '#e64980', bg: '#fff0f6', border: '#ffbdd8' },
  'PC방': { primary: '#1c7ed6', bg: '#e7f5ff', border: '#a5d8ff' },
  '헬스장': { primary: '#37b24d', bg: '#ebfbee', border: '#b2f2bb' },
  '노래방': { primary: '#f59f00', bg: '#fff9db', border: '#ffec99' },
  // 기본값
  'default': { primary: '#868e96', bg: '#f8f9fa', border: '#dee2e6' },
};

// ============================================
// 사이드바 카테고리 구조
// ============================================
export interface SidebarCategoryItem {
  keyword: string;
  label: string;
  multi?: string; // 복수 검색용 (쉼표로 구분)
}

export const sidebarCategories: Record<string, SidebarCategoryItem[]> = {
  '음식점': [
    { keyword: '전체음식점', multi: '한식,중식,일식,양식,분식', label: '전체' },
    { keyword: '한식', label: '한식' },
    { keyword: '중식', label: '중식' },
    { keyword: '일식', label: '일식' },
    { keyword: '양식', label: '양식' },
    { keyword: '분식', label: '분식' },
  ],
  '기타': [
    { keyword: '카페', label: '카페' },
    { keyword: '편의점', label: '편의점' },
    { keyword: '약국', label: '약국' },
    { keyword: '병원', label: '병원' },
    { keyword: '은행', label: '은행/ATM' },
    { keyword: '문구점', label: '문구점' },
    { keyword: '미용실', label: '미용실' },
    { keyword: 'PC방', label: 'PC방' },
    { keyword: '헬스장', label: '헬스장' },
    { keyword: '노래방', label: '노래방' },
  ],
};

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
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 카테고리 정보 가져오기
 */
export function getCategoryInfo(keyword: string): CategoryInfo {
  return categoryInfo[keyword] || {
    icon: '📍',
    title: keyword,
    desc: `주변의 ${keyword}을(를) 확인하세요`,
  };
}

/**
 * 카테고리 색상 가져오기 (category_name에서 키워드 매칭)
 */
export function getCategoryColor(categoryName?: string): CategoryColor {
  if (!categoryName) return categoryColors['default'];

  // category_name에서 키워드 매칭 (예: "음식점 > 한식" → "한식")
  for (const key of Object.keys(categoryColors)) {
    if (key !== 'default' && categoryName.includes(key)) {
      return categoryColors[key];
    }
  }

  return categoryColors['default'];
}

/**
 * 카테고리 아이콘 가져오기
 */
export function getCategoryIcon(categoryName?: string): string {
  if (!categoryName) return '📍';

  for (const [key, info] of Object.entries(categoryInfo)) {
    if (categoryName.includes(key)) {
      return info.icon;
    }
  }

  return '📍';
}
