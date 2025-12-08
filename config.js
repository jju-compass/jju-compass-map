/**
 * JJU Compass Map - Configuration
 * 카테고리 정보 및 전역 설정
 */

// ============================================
// SVG 아이콘 템플릿
// ============================================
const SVGIcons = {
    // 위치/지도 관련
    mapPin: (size = 20, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>`,
    
    navigation: (size = 20, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <circle cx="12" cy="10" r="3"></circle>
            <path d="M12 2v4M12 14v8"></path>
            <circle cx="12" cy="21" r="1"></circle>
        </svg>`,
    
    gps: (size = 20, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>`,

    // 액션 아이콘
    close: (size = 18, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`,
    
    search: (size = 20, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
        </svg>`,
    
    externalLink: (size = 14, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>`,
    
    refresh: (size = 18, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <path d="M1 4v6h6"></path>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>`,
    
    trash: (size = 18, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`,

    // 즐겨찾기
    heart: (size = 18, fill = 'none', stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>`,

    // 연락처
    phone: (size = 14, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>`,

    // 시계
    clock: (size = 14, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
        </svg>`,

    // 메뉴
    menu: (size = 24, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18"></path>
        </svg>`,

    // 사운드
    volumeOn: (size = 18, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>`,

    // 에러
    alertCircle: (size = 40, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`,

    // 체크
    check: (size = 20, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>`,
    
    // 트렌드/인기
    trendingUp: (size = 14, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>`,
        
    // 히스토리
    history: (size = 14, stroke = 'currentColor') => `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>`
};

/**
 * SVG 아이콘 가져오기 헬퍼
 * @param {string} name - 아이콘 이름
 * @param {number} size - 크기 (기본값: 20)
 * @param {string} stroke - 선 색상 (기본값: 'currentColor')
 * @param {string} fill - 채우기 색상 (heart 아이콘용)
 * @returns {string} - SVG HTML 문자열
 */
function getIcon(name, size = 20, stroke = 'currentColor', fill = 'none') {
    if (!SVGIcons[name]) {
        console.warn(`[Icons] Unknown icon: ${name}`);
        return SVGIcons.mapPin(size, stroke);
    }
    
    // heart 아이콘은 fill 파라미터 지원
    if (name === 'heart') {
        return SVGIcons.heart(size, fill, stroke);
    }
    
    return SVGIcons[name](size, stroke);
}

// ============================================
// 카테고리 정보
// ============================================
const categoryInfo = {
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
    '노래방': { icon: '🎤', title: '노래방', desc: '주변의 노래방을 확인하세요' }
};

// ============================================
// 카테고리별 색상 테마
// ============================================
const categoryColors = {
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
    'default': { primary: '#868e96', bg: '#f8f9fa', border: '#dee2e6' }
};

/**
 * 카테고리 색상 가져오기
 * @param {string} categoryName - 카테고리 이름 (Kakao API의 category_name)
 * @returns {Object} - { primary, bg, border }
 */
function getCategoryColor(categoryName) {
    if (!categoryName) return categoryColors['default'];
    
    // category_name에서 키워드 매칭 (예: "음식점 > 한식" → "한식")
    for (const key of Object.keys(categoryColors)) {
        if (categoryName.includes(key)) {
            return categoryColors[key];
        }
    }
    
    return categoryColors['default'];
}

// ============================================
// 사이드바 카테고리 구조
// ============================================
const sidebarCategories = {
    '음식점': [
        { keyword: '전체음식점', multi: '한식,중식,일식,양식,분식', label: '전체', icon: 'utensils' },
        { keyword: '한식', label: '한식', icon: 'utensils' },
        { keyword: '중식', label: '중식', icon: 'utensils' },
        { keyword: '일식', label: '일식', icon: 'utensils' },
        { keyword: '양식', label: '양식', icon: 'utensils' },
        { keyword: '분식', label: '분식', icon: 'utensils' }
    ],
    '기타': [
        { keyword: '카페', label: '카페', icon: 'coffee' },
        { keyword: '편의점', label: '편의점', icon: 'store' },
        { keyword: '약국', label: '약국', icon: 'plus' },
        { keyword: '병원', label: '병원', icon: 'hospital' },
        { keyword: '은행', label: '은행/ATM', icon: 'bank' },
        { keyword: '문구점', label: '문구점', icon: 'pen' },
        { keyword: '미용실', label: '미용실', icon: 'scissors' },
        { keyword: 'PC방', label: 'PC방', icon: 'monitor' },
        { keyword: '헬스장', label: '헬스장', icon: 'dumbbell' },
        { keyword: '노래방', label: '노래방', icon: 'music' }
    ]
};

// ============================================
// 지도 기본 설정
// ============================================
const mapConfig = {
    // 전주대학교 중심 좌표
    center: {
        lat: 35.814445811028584,
        lng: 127.09236571436321
    },
    // 기본 줌 레벨
    defaultLevel: 4,
    // 검색 반경 (미터)
    searchRadius: 2000,
    // 한 페이지당 최대 결과 수
    pageSize: 15,
    // 최대 페이지 수
    maxPages: 3
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 카테고리 정보 가져오기
 * @param {string} keyword - 카테고리 키워드
 * @returns {Object} - { icon, title, desc }
 */
function getCategoryInfo(keyword) {
    return categoryInfo[keyword] || { 
        icon: '📍', 
        title: keyword, 
        desc: `주변의 ${keyword}을(를) 확인하세요` 
    };
}

/**
 * 카테고리 헤더 업데이트
 * @param {string} keyword - 카테고리 키워드
 */
function updateCategoryHeader(keyword) {
    const info = getCategoryInfo(keyword);
    const iconEl = document.getElementById('categoryIcon');
    const titleEl = document.getElementById('categoryTitle');
    const descEl = document.getElementById('categoryDesc');
    
    if (iconEl) iconEl.textContent = info.icon;
    if (titleEl) titleEl.textContent = info.title;
    if (descEl) descEl.textContent = info.desc;
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SVGIcons,
        getIcon,
        categoryInfo,
        categoryColors,
        getCategoryColor,
        sidebarCategories,
        mapConfig,
        getCategoryInfo,
        updateCategoryHeader
    };
}
