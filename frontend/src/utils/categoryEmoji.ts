/**
 * 카테고리별 이모지 매핑 유틸리티
 */

// 카테고리 키워드 → 이모지 매핑
const CATEGORY_EMOJI_MAP: Record<string, string> = {
  // 음식점
  '한식': '🍚',
  '중식': '🥟',
  '일식': '🍣',
  '양식': '🍝',
  '분식': '🍜',
  '치킨': '🍗',
  '피자': '🍕',
  '햄버거': '🍔',
  '고기': '🥩',
  '해산물': '🦐',
  '국밥': '🍲',
  '찌개': '🍲',
  '면': '🍜',
  '밥': '🍚',
  
  // 기타 시설
  '카페': '☕',
  '커피': '☕',
  '베이커리': '🥐',
  '빵': '🥐',
  '디저트': '🍰',
  '편의점': '🏪',
  '마트': '🛒',
  '약국': '💊',
  '병원': '🏥',
  '의원': '🏥',
  '은행': '🏦',
  'ATM': '🏧',
  '문구': '✏️',
  '미용': '💇',
  '헤어': '💇',
  'PC방': '🖥️',
  '헬스': '💪',
  '피트니스': '💪',
  '노래방': '🎤',
  '주점': '🍺',
  '술집': '🍺',
  '호프': '🍺',
};

// 기본 이모지 (매칭되는 카테고리가 없을 때)
const DEFAULT_EMOJI = '📍';
const DEFAULT_FOOD_EMOJI = '🍽️';

/**
 * 카테고리 이름에서 적절한 이모지를 반환합니다.
 * @param categoryName - 카카오 API의 category_name (예: "음식점 > 한식 > 국밥")
 * @returns 해당 카테고리에 맞는 이모지
 */
export function getCategoryEmoji(categoryName: string): string {
  if (!categoryName) return DEFAULT_EMOJI;
  
  const lowerCategory = categoryName.toLowerCase();
  
  // 매핑 테이블에서 매칭되는 키워드 찾기
  for (const [keyword, emoji] of Object.entries(CATEGORY_EMOJI_MAP)) {
    if (lowerCategory.includes(keyword.toLowerCase())) {
      return emoji;
    }
  }
  
  // 음식점 카테고리인 경우 기본 음식 이모지
  if (lowerCategory.includes('음식점') || lowerCategory.includes('식당')) {
    return DEFAULT_FOOD_EMOJI;
  }
  
  return DEFAULT_EMOJI;
}

/**
 * 카테고리 이름을 간략화합니다.
 * 예: "음식점 > 한식 > 국밥" → "한식 > 국밥"
 * @param categoryName - 전체 카테고리 이름
 * @returns 간략화된 카테고리 이름
 */
export function getShortCategory(categoryName: string): string {
  if (!categoryName) return '';
  
  const parts = categoryName.split('>').map(part => part.trim());
  
  // 첫 번째 대분류 제거 (음식점, 서비스 등)
  if (parts.length > 1) {
    return parts.slice(1).join(' > ');
  }
  
  return categoryName;
}

/**
 * 카테고리에서 대분류만 추출합니다.
 * 예: "음식점 > 한식 > 국밥" → "음식점"
 * @param categoryName - 전체 카테고리 이름
 * @returns 대분류 카테고리
 */
export function getMainCategory(categoryName: string): string {
  if (!categoryName) return '';
  
  const parts = categoryName.split('>');
  return parts[0].trim();
}

/**
 * 카테고리에서 중분류를 추출합니다.
 * 예: "음식점 > 한식 > 국밥" → "한식"
 * @param categoryName - 전체 카테고리 이름
 * @returns 중분류 카테고리
 */
export function getSubCategory(categoryName: string): string {
  if (!categoryName) return '';
  
  const parts = categoryName.split('>').map(part => part.trim());
  return parts[1] || parts[0] || '';
}

export default {
  getCategoryEmoji,
  getShortCategory,
  getMainCategory,
  getSubCategory,
};
