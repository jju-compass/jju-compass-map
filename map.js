/**
 * JJU Compass Map - 지도 핵심 모듈
 * 전주대학교 주변 시설 검색 서비스
 */

// ============================================
// 전역 상태 관리 객체
// ============================================
const MapState = {
    markers: [],
    infowindow: null,
    transientOverlays: [],
    route: {
        startPosition: null,
        startMarker: null,
        polyline: null,
        animMarker: null,
        pickingStart: false,
        pickClickHandler: null
    },
    currentAnimationId: null,
    sounds: {
        enabled: true
    },
    // 즐겨찾기 상태
    favorites: new Set(),
    // 현재 검색 결과
    currentResults: []
};

// 서버 API 엔드포인트
// 프로덕션: 빈 문자열 (같은 도메인의 /api/ 사용)
// 로컬 개발: localhost:3000
const API_BASE = (typeof window !== 'undefined' && window.JJU_API_BASE) 
    ? window.JJU_API_BASE 
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000'
        : '';

// 선택: 서버에 구현한 도보 길찾기 프록시 API 엔드포인트
const DIRECTIONS_API = (typeof window !== 'undefined' && window.JJU_DIRECTIONS_API) ? window.JJU_DIRECTIONS_API : null;

// ============================================
// 사용자 ID 관리
// ============================================

/**
 * 사용자 ID 가져오기 (없으면 생성)
 */
function getUserId() {
    let userId = localStorage.getItem('jju_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('jju_user_id', userId);
    }
    return userId;
}

// ============================================
// API 클라이언트
// ============================================

const JJUApi = {
    userId: null,
    
    init() {
        this.userId = getUserId();
        // 서버 설정 저장 (사운드 등)
        this.loadUserPreferences();
    },
    
    /**
     * API 요청 헬퍼
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-User-Id': this.userId,
            ...options.headers
        };
        
        try {
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('[JJU API]', endpoint, 'failed:', error.message);
            return null;
        }
    },
    
    // ============================================
    // 검색 캐시 API
    // ============================================
    
    /**
     * 캐시된 검색 결과 조회
     */
    async getCachedSearch(keyword) {
        const data = await this.request(`/api/cache/search?keyword=${encodeURIComponent(keyword)}`);
        if (data && data.cached) {
            console.log(`[Cache Hit] ${keyword} (${data.cacheAge}초 전 캐시)`);
            return data.results;
        }
        return null;
    },
    
    /**
     * 검색 결과 캐시 저장
     */
    async setCachedSearch(keyword, results) {
        return await this.request('/api/cache/search', {
            method: 'POST',
            body: JSON.stringify({ keyword, results })
        });
    },
    
    // ============================================
    // 즐겨찾기 API
    // ============================================
    
    /**
     * 즐겨찾기 목록 가져오기
     */
    async getFavorites() {
        const data = await this.request('/api/favorites');
        if (data && data.favorites) {
            // 즐겨찾기 ID Set 업데이트
            MapState.favorites = new Set(data.favorites.map(f => f.place_id));
            return data.favorites;
        }
        return [];
    },
    
    /**
     * 즐겨찾기 추가
     */
    async addFavorite(place) {
        const result = await this.request('/api/favorites', {
            method: 'POST',
            body: JSON.stringify(place)
        });
        if (result && result.success) {
            MapState.favorites.add(place.id || place.place_id);
        }
        return result;
    },
    
    /**
     * 즐겨찾기 제거
     */
    async removeFavorite(placeId) {
        const result = await this.request(`/api/favorites/${placeId}`, {
            method: 'DELETE'
        });
        if (result && result.success) {
            MapState.favorites.delete(placeId);
        }
        return result;
    },
    
    /**
     * 즐겨찾기 토글
     */
    async toggleFavorite(place) {
        const placeId = place.id || place.place_id;
        if (MapState.favorites.has(placeId)) {
            return await this.removeFavorite(placeId);
        } else {
            return await this.addFavorite(place);
        }
    },
    
    /**
     * 여러 장소 즐겨찾기 상태 확인
     */
    async checkFavorites(placeIds) {
        const data = await this.request('/api/favorites/check', {
            method: 'POST',
            body: JSON.stringify({ placeIds })
        });
        if (data && data.favorites) {
            // MapState 업데이트
            Object.entries(data.favorites).forEach(([id, isFav]) => {
                if (isFav) MapState.favorites.add(id);
                else MapState.favorites.delete(id);
            });
            return data.favorites;
        }
        return {};
    },
    
    // ============================================
    // 검색 히스토리 API
    // ============================================
    
    /**
     * 검색 히스토리 가져오기
     */
    async getHistory(limit = 10) {
        const data = await this.request(`/api/history?limit=${limit}`);
        return data ? data.history : [];
    },
    
    /**
     * 인기 검색어 가져오기
     */
    async getPopularSearches(limit = 10) {
        const data = await this.request(`/api/history/popular?limit=${limit}`);
        return data ? data.popular : [];
    },
    
    /**
     * 검색 히스토리 삭제
     */
    async clearHistory() {
        return await this.request('/api/history', { method: 'DELETE' });
    },
    
    // ============================================
    // 사용자 설정
    // ============================================
    
    /**
     * 사용자 설정 저장 (로컬)
     */
    saveUserPreferences() {
        const prefs = {
            soundEnabled: MapState.sounds.enabled,
            startPosition: MapState.route.startPosition ? {
                lat: MapState.route.startPosition.getLat(),
                lng: MapState.route.startPosition.getLng()
            } : null
        };
        localStorage.setItem('jju_preferences', JSON.stringify(prefs));
    },
    
    /**
     * 사용자 설정 로드 (로컬)
     */
    loadUserPreferences() {
        try {
            const prefs = JSON.parse(localStorage.getItem('jju_preferences') || '{}');
            if (typeof prefs.soundEnabled === 'boolean') {
                MapState.sounds.enabled = prefs.soundEnabled;
            }
            // 시작 위치는 지도 초기화 후 설정
            this._savedStartPosition = prefs.startPosition;
        } catch (e) {
            console.warn('[Preferences] 로드 실패:', e);
        }
    },
    
    /**
     * 저장된 시작 위치 적용
     */
    applyStartPosition(map) {
        if (this._savedStartPosition && typeof kakao !== 'undefined') {
            const { lat, lng } = this._savedStartPosition;
            const position = new kakao.maps.LatLng(lat, lng);
            setStartPosition(map, position);
        }
    }
};

// API 초기화
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        JJUApi.init();
    });
}

// ============================================
// 사운드 효과 시스템
// ============================================

/**
 * 사운드 효과 생성 (Web Audio API)
 */
const SoundEffects = {
    audioContext: null,
    
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    },
    
    // 클릭/선택 효과음
    playClick() {
        if (!MapState.sounds.enabled) return;
        try {
            const ctx = this.init();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
        } catch (e) { console.log('Sound error:', e); }
    },
    
    // 검색 완료 효과음
    playSearchComplete() {
        if (!MapState.sounds.enabled) return;
        try {
            const ctx = this.init();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
            oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.35);
        } catch (e) { console.log('Sound error:', e); }
    },
    
    // 경로 시작 효과음
    playRouteStart() {
        if (!MapState.sounds.enabled) return;
        try {
            const ctx = this.init();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch (e) { console.log('Sound error:', e); }
    },
    
    // 경로 도착 효과음
    playRouteComplete() {
        if (!MapState.sounds.enabled) return;
        try {
            const ctx = this.init();
            
            // 두 음 연속 재생 (도착 느낌)
            [0, 0.15, 0.3].forEach((delay, i) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                const freqs = [523, 659, 784]; // C5, E5, G5
                oscillator.frequency.setValueAtTime(freqs[i], ctx.currentTime + delay);
                
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime + delay);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
                
                oscillator.start(ctx.currentTime + delay);
                oscillator.stop(ctx.currentTime + delay + 0.2);
            });
        } catch (e) { console.log('Sound error:', e); }
    },
    
    // 에러 효과음
    playError() {
        if (!MapState.sounds.enabled) return;
        try {
            const ctx = this.init();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.25);
        } catch (e) { console.log('Sound error:', e); }
    }
};

/**
 * 사운드 토글 버튼 생성
 */
function createSoundToggleButton() {
    if (document.querySelector('.sound-toggle')) return;
    
    const btn = document.createElement('button');
    btn.className = 'sound-toggle';
    btn.title = '사운드 켜기/끄기';
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
    `;
    
    btn.onclick = function() {
        MapState.sounds.enabled = !MapState.sounds.enabled;
        btn.classList.toggle('muted', !MapState.sounds.enabled);
        btn.title = MapState.sounds.enabled ? '사운드 끄기' : '사운드 켜기';
        
        // 토글 시 피드백 사운드
        if (MapState.sounds.enabled) {
            SoundEffects.playClick();
        }
    };
    
    document.body.appendChild(btn);
}

// 페이지 로드 시 사운드 버튼 생성
document.addEventListener('DOMContentLoaded', createSoundToggleButton);

// ============================================
// 에러 처리 유틸리티
// ============================================

/**
 * 에러 메시지 상수
 */
const ErrorMessages = {
    'map-container-missing': {
        title: '지도를 표시할 수 없습니다',
        message: '지도 영역을 찾을 수 없습니다. 페이지를 새로고침해주세요.'
    },
    'kakao-sdk-failed': {
        title: '카카오맵 로드 실패',
        message: '카카오맵을 불러오는 데 실패했습니다. 인터넷 연결을 확인해주세요.'
    },
    'search-failed': {
        title: '검색 실패',
        message: '장소 검색 중 오류가 발생했습니다. 다시 시도해주세요.'
    },
    'geolocation-failed': {
        title: '위치 확인 실패',
        message: '현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.'
    },
    'no-results': {
        title: '검색 결과 없음',
        message: '검색 결과가 없습니다. 다른 키워드로 검색해보세요.'
    }
};

/**
 * 에러 UI 표시
 */
function showErrorUI(errorType, containerId = 'places-list') {
    // 🔊 에러 사운드 재생
    SoundEffects.playError();
    
    const container = document.getElementById(containerId);
    if (!container) return;

    const error = ErrorMessages[errorType] || {
        title: '오류 발생',
        message: '알 수 없는 오류가 발생했습니다.'
    };

    container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h3 class="error-title">${error.title}</h3>
            <p class="error-message">${error.message}</p>
            <button class="error-retry-btn" onclick="location.reload()">
                다시 시도
            </button>
        </div>
    `;
}

/**
 * 스켈레톤 로딩 UI 표시
 */
function showSkeletonLoading(containerId = 'places-list', count = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `
            <div class="skeleton-item">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text-short"></div>
            </div>
        `;
    }
    container.innerHTML = skeletonHTML;
}

/**
 * 로딩 스피너 표시
 */
function showLoadingSpinner(containerId = 'places-list', message = '검색 중...') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">${message}</p>
        </div>
    `;
}

// ============================================
// 지도 초기화
// ============================================

/**
 * Kakao Maps API를 이용해 지도 영역을 초기화하는 함수입니다.
 */
function initializeMap() {
    const mapContainer = document.getElementById('map');
    
    // 컨테이너 확인
    if (!mapContainer) {
        console.error('지도를 표시할 #map 요소가 없습니다.');
        showErrorUI('map-container-missing');
        return null;
    }

    // Kakao SDK 확인
    if (typeof kakao === 'undefined' || !kakao.maps) {
        console.error('Kakao Maps SDK가 로드되지 않았습니다.');
        showErrorUI('kakao-sdk-failed');
        return null;
    }

    try {
        const mapOption = {
            center: new kakao.maps.LatLng(35.814445811028584, 127.09236571436321),
            level: 4
        };

        const map = new kakao.maps.Map(mapContainer, mapOption);
        
        // 모바일에서 지도 크기가 올바르게 계산되도록 relayout 호출
        setTimeout(() => {
            map.relayout();
        }, 100);

        // 도보 경로 컨트롤 UI 부착
        try { 
            attachRouteControls(map); 
        } catch (e) {
            console.warn('경로 컨트롤 부착 실패:', e);
        }

        return map;
    } catch (e) {
        console.error('지도 초기화 실패:', e);
        showErrorUI('map-container-missing');
        return null;
    }
}

    /**
     * 위경도 도우미: 미터를 위도 변화량으로 변환 (대략)
     */
    function metersToDeltaLat(meters) {
        return meters / 111320; // 1도 위도 ≈ 111.32km
    }

    /**
     * 선형 보간
     */
    function lerp(a, b, t) { return a + (b - a) * t; }

    /**
     * 부드러운 easeOutCubic
     */
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    /**
     * 마커 드롭 애니메이션
     * - marker: kakao.maps.Marker
     * - targetPos: kakao.maps.LatLng
     * - duration: ms (기본 700)
     * - offsetMeters: 위쪽에서 시작할 오프셋 (기본 40m)
     */
    function dropMarker(marker, targetPos, duration = 700, offsetMeters = 40) {
        try {
            const startLat = targetPos.getLat() - metersToDeltaLat(offsetMeters);
            const startLng = targetPos.getLng();
            const start = performance.now();
            function step(now) {
                const t = Math.min(1, (now - start) / duration);
                const e = easeOutCubic(t);
                const curLat = lerp(startLat, targetPos.getLat(), e);
                const curLng = lerp(startLng, targetPos.getLng(), e);
                marker.setPosition(new kakao.maps.LatLng(curLat, curLng));
                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    marker.setPosition(targetPos);
                }
            }
            requestAnimationFrame(step);
        } catch (e) {
            // 애니메이션 실패 시 원위치
            marker.setPosition(targetPos);
        }
    }

    /**
     * 마커 바운스 애니메이션 (짧게 톡톡 튀는 효과)
     * - heightMeters: 최대 튀어오르는 높이 (기본 20m)
     * - duration: 전체 시간 (기본 700ms)
     */
    function bounceMarker(marker, heightMeters = 20, duration = 700) {
        const originPos = marker.getPosition();
        const originLat = originPos.getLat();
        const originLng = originPos.getLng();
        const amp = metersToDeltaLat(heightMeters);
        const start = performance.now();
        function step(now) {
            const t = Math.min(1, (now - start) / duration);
            // 감쇠되는 바운스: 절댓값 사인과 감소 계수
            const bounces = 2.5; // 튀는 횟수
            const envelope = 1 - t; // 서서히 감소
            const offset = Math.abs(Math.sin(t * Math.PI * bounces)) * amp * envelope;
            // 위로 튀도록 위도 감소 방향으로 적용
            const curLat = originLat - offset;
            marker.setPosition(new kakao.maps.LatLng(curLat, originLng));
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                marker.setPosition(originPos);
            }
        }
        requestAnimationFrame(step);
    }

    /**
     * 단순 경로를 따라 마커를 이동시키는 애니메이션 (데모용)
     * - path: kakao.maps.LatLng[] (최소 2개)
     * - duration: 전체 시간 ms
     * - onDone: 완료 콜백
     * - map: 지도 객체 (발자국 트레일용)
     */
    function animateMarkerAlongPath(marker, path, duration = 2000, onDone, map = null) {
        if (!Array.isArray(path) || path.length < 2) return;
        const start = performance.now();
        let lastFootstepTime = 0;
        const footstepInterval = 300; // 발자국 간격 (ms)

        if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE) {
            console.log('[JJU Walk] animate start: segments=', path.length - 1, 'duration=', duration);
        }
        function interp(p0, p1, t) {
            return new kakao.maps.LatLng(
                lerp(p0.getLat(), p1.getLat(), t),
                lerp(p0.getLng(), p1.getLng(), t)
            );
        }
        function step(now) {
            const t = Math.min(1, (now - start) / duration);
            const elapsed = now - start;

            // 구간 수에 비례하여 진행
            const segCount = path.length - 1;
            const ft = t * segCount;
            const i = Math.min(segCount - 1, Math.floor(ft));
            const localT = ft - i;
            const pos = interp(path[i], path[i + 1], localT);
            marker.setPosition(pos);

            // 발자국 트레일 생성
            if (map && elapsed - lastFootstepTime > footstepInterval && t < 0.98) {
                createFootstepTrail(map, pos);
                lastFootstepTime = elapsed;
            }

            if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE && (Math.floor(t * 100) % 15 === 0)) {
                console.log('[JJU Walk] t=', t.toFixed(2), 'seg=', i, 'localT=', localT.toFixed(2));
            }
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                marker.setPosition(path[path.length - 1]);
                if (typeof onDone === 'function') onDone();
                if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE) {
                    console.log('[JJU Walk] animate end');
                }
            }
        }
        requestAnimationFrame(step);
    }

    /**
     * 발자국 트레일 효과 생성
     */
    function createFootstepTrail(map, position) {
        const div = document.createElement('div');
        div.className = 'footstep-trail';

        const overlay = new kakao.maps.CustomOverlay({
            position,
            content: div,
            yAnchor: 0.5,
            zIndex: 2
        });
        overlay.setMap(map);
        MapState.transientOverlays.push(overlay);

        // 애니메이션 후 제거
        setTimeout(() => {
            overlay.setMap(null);
            const idx = MapState.transientOverlays.indexOf(overlay);
            if (idx > -1) MapState.transientOverlays.splice(idx, 1);
        }, 1200);
    }

    /**
     * 클릭 위치에 리플 효과 표시 (CustomOverlay + CSS 애니메이션)
     */
    function showRippleEffect(map, position, color = '#4CAF50') {
        const div = document.createElement('div');
        div.className = 'kmap-ripple';
        div.style.borderColor = color;
        div.style.backgroundColor = color + '33';
        const overlay = new kakao.maps.CustomOverlay({
            position,
            content: div,
            yAnchor: 0.5,
            zIndex: 3
        });
        overlay.setMap(map);
        MapState.transientOverlays.push(overlay);
        // 애니메이션 종료 후 제거
        setTimeout(() => {
            overlay.setMap(null);
            MapState.transientOverlays = MapState.transientOverlays.filter(o => o !== overlay);
        }, 650);
    }

/**
 * 지도에 표시된 모든 마커를 제거하는 함수입니다.
 * - 메모리 누수 방지를 위해 이벤트 리스너도 함께 제거합니다.
 */
function clearMarkers() {
    // 인포윈도우 닫기
    if (MapState.infowindow) {
        MapState.infowindow.close();
    }
    
    // 모든 마커 제거
    for (let i = 0; i < MapState.markers.length; i++) {
        MapState.markers[i].setMap(null);
    }
    MapState.markers = [];
    
    // 임시 오버레이 제거
    MapState.transientOverlays.forEach(o => o.setMap(null));
    MapState.transientOverlays = [];
}

/**
 * 작은 점 마커 생성 (경로 애니메이션 시 시각화용)
 */
function createDotMarker(position) {
    const svg = encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">\n' +
        '  <circle cx="6" cy="6" r="4" fill="#4CAF50" fill-opacity="0.9" />\n' +
        '  <circle cx="6" cy="6" r="5" fill="none" stroke="#2e7d32" stroke-width="1" stroke-opacity="0.9"/>\n' +
        '</svg>'
    );
    const src = `data:image/svg+xml;charset=UTF-8,${svg}`;
    const size = new kakao.maps.Size(12, 12);
    const offset = new kakao.maps.Point(6, 6);
    const image = new kakao.maps.MarkerImage(src, size, { offset });
    return new kakao.maps.Marker({ position, image, zIndex: 4 });
}

/**
 * 워커(사람) 마커 - 실제 사람 이모지 사용
 */
function createWalkerMarker(position) {
    const el = document.createElement('div');
    el.className = 'walker-avatar';
    el.style.fontSize = '40px';
    el.style.lineHeight = '1';
    el.textContent = '🚶‍♂️';

    return new kakao.maps.CustomOverlay({
        position,
        content: el,
        yAnchor: 0.5,
        zIndex: 7
    });
}

/**
 * 시작 지점 깃발 마커 생성
 */
function createStartFlagMarker(position) {
    const el = document.createElement('div');
    el.className = 'start-flag-marker';
    el.innerHTML = `
        <div class="flag-pole"></div>
        <div class="flag-icon">🚩</div>
    `;

    return new kakao.maps.CustomOverlay({
        position,
        content: el,
        yAnchor: 1,
        zIndex: 6
    });
}

/**
 * 시작 지점 설정 및 깃발 마커 표시/업데이트
 */
function setStartPosition(map, latLng) {
    MapState.route.startPosition = latLng;
    if (MapState.route.startMarker) {
        MapState.route.startMarker.setPosition(latLng);
    } else {
        MapState.route.startMarker = createStartFlagMarker(latLng);
        MapState.route.startMarker.setMap(map);
    }
    showRippleEffect(map, latLng, '#4c6ef5');
}

/**
 * 지도 클릭으로 시작 지점 지정 모드 토글
 */
function toggleStartPickMode(map, enable) {
    MapState.route.pickingStart = enable;
    if (enable) {
        if (!MapState.route.pickClickHandler) {
            MapState.route.pickClickHandler = function(e) {
                setStartPosition(map, e.latLng);
                toggleStartPickMode(map, false);
                alert('시작 지점이 설정되었습니다. 목적지를 클릭하면 경로가 재생됩니다.');
            };
        }
        kakao.maps.event.addListener(map, 'click', MapState.route.pickClickHandler);
    } else if (MapState.route.pickClickHandler) {
        kakao.maps.event.removeListener(map, 'click', MapState.route.pickClickHandler);
    }
}

/**
 * 내 위치(브라우저 Geolocation)로 시작 지점 설정
 */
function setStartFromGeolocation(map) {
    if (!navigator.geolocation) {
        alert('브라우저에서 위치 정보를 지원하지 않습니다.');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const ll = new kakao.maps.LatLng(lat, lng);
            setStartPosition(map, ll);
            if (typeof map.panTo === 'function') map.panTo(ll);
        },
        (err) => {
            console.warn('Geolocation 실패:', err);
            alert('내 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
}

/**
 * 컨트롤 UI 생성/부착
 */
function attachRouteControls(map) {
    // 이미 있으면 중복 생성 방지
    if (document.getElementById('route-controls')) return;
    const controls = document.createElement('div');
    controls.id = 'route-controls';
    controls.className = 'route-controls';
    controls.innerHTML = `
        <button class="rc-btn rc-btn-primary" id="rc-route">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M12 2v4M12 14v8"></path>
                <circle cx="12" cy="21" r="1"></circle>
            </svg>
            <span>경로 보기</span>
        </button>
        <button class="rc-btn rc-btn-secondary" id="rc-clear" style="display:none;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>경로 지우기</span>
        </button>
    `;
    document.body.appendChild(controls);

    // 경로 보기 버튼 클릭
    document.getElementById('rc-route').onclick = () => {
        if (!MapState.route.startPosition) {
            // 시작 지점이 없으면 선택 모달 표시
            showRouteStartModal(map);
        } else {
            // 이미 시작 지점이 있으면 안내 메시지
            alert('마커를 클릭하면 경로가 표시됩니다.\n시작 지점을 변경하려면 "경로 지우기"를 먼저 눌러주세요.');
        }
    };

    // 경로 지우기 버튼
    document.getElementById('rc-clear').onclick = () => {
        clearRoute(map);
        if (MapState.route.startMarker) {
            MapState.route.startMarker.setMap(null);
            MapState.route.startMarker = null;
            MapState.route.startPosition = null;
        }
        // 경로 지우기 버튼 숨김
        document.getElementById('rc-clear').style.display = 'none';
    };
}

/**
 * 경로 시작 지점 선택 모달 표시
 */
function showRouteStartModal(map) {
    // 기존 모달 제거
    const existing = document.getElementById('route-start-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'route-start-modal';
    modal.className = 'route-modal';
    modal.innerHTML = `
        <div class="route-modal-overlay"></div>
        <div class="route-modal-content">
            <h3 class="route-modal-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                시작 지점을 선택하세요
            </h3>
            <p class="route-modal-desc">출발 위치를 설정하면 목적지까지의 경로를 확인할 수 있습니다</p>
            <div class="route-modal-buttons">
                <button class="route-modal-btn route-modal-btn-primary" id="modal-gps">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <div>
                        <div class="btn-title">내 위치 사용</div>
                        <div class="btn-desc">GPS로 자동 설정</div>
                    </div>
                </button>
                <button class="route-modal-btn" id="modal-manual">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    <div>
                        <div class="btn-title">지도에서 선택</div>
                        <div class="btn-desc">직접 클릭하여 지정</div>
                    </div>
                </button>
            </div>
            <button class="route-modal-close" id="modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    // GPS 버튼
    document.getElementById('modal-gps').onclick = () => {
        modal.remove();
        setStartFromGeolocation(map);
        // 경로 지우기 버튼 표시
        document.getElementById('rc-clear').style.display = 'flex';
    };

    // 수동 선택 버튼
    document.getElementById('modal-manual').onclick = () => {
        modal.remove();
        toggleStartPickMode(map, true);
        alert('지도를 클릭하여 시작 지점을 선택하세요.');
        // 경로 지우기 버튼 표시
        document.getElementById('rc-clear').style.display = 'flex';
    };

    // 닫기 버튼
    document.getElementById('modal-close').onclick = () => modal.remove();

    // 오버레이 클릭으로 닫기
    modal.querySelector('.route-modal-overlay').onclick = () => modal.remove();
}

/** 경로/애니메이션 정리 */
function clearRoute(map) {
    // 진행 중인 애니메이션 취소
    if (MapState.currentAnimationId) {
        cancelAnimationFrame(MapState.currentAnimationId);
        MapState.currentAnimationId = null;
    }
    
    if (MapState.route.polyline) { 
        MapState.route.polyline.setMap(null); 
        MapState.route.polyline = null; 
    }
    if (MapState.route.animMarker) { 
        MapState.route.animMarker.setMap(null); 
        MapState.route.animMarker = null; 
    }
    hideRouteInfoPanel();
    // 시작 마커는 유지
}

/**
 * 경로 정보 패널 표시
 */
function showRouteInfoPanel(distanceMeters, timeMinutes) {
    let panel = document.getElementById('route-info-panel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'route-info-panel';
        panel.className = 'route-info-panel';
        document.body.appendChild(panel);
    }

    const distanceKm = (distanceMeters / 1000).toFixed(2);
    const distanceM = Math.round(distanceMeters);

    panel.innerHTML = `
        <div class="route-info-header">
            <div class="route-info-icon">🚶</div>
            <div class="route-info-title">도보 경로</div>
        </div>
        <div class="route-info-stats">
            <div class="route-info-stat">
                <div class="route-info-stat-value">${distanceMeters >= 1000 ? distanceKm + '<span class="unit">km</span>' : distanceM + '<span class="unit">m</span>'}</div>
                <div class="route-info-stat-label">거리</div>
            </div>
            <div class="route-info-divider"></div>
            <div class="route-info-stat">
                <div class="route-info-stat-value">${timeMinutes}<span class="unit">분</span></div>
                <div class="route-info-stat-label">예상 시간</div>
            </div>
        </div>
    `;

    panel.classList.remove('hidden');
}

/**
 * 경로 정보 패널 숨김
 */
function hideRouteInfoPanel() {
    const panel = document.getElementById('route-info-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

/** 두 지점 거리(m) (haversine 근사) */
function distanceMeters(a, b) {
    const R = 6371000; // m
    const toRad = (x) => x * Math.PI / 180;
    const dLat = toRad(b.getLat() - a.getLat());
    const dLng = toRad(b.getLng() - a.getLng());
    const lat1 = toRad(a.getLat());
    const lat2 = toRad(b.getLat());
    const sinDLat = Math.sin(dLat/2);
    const sinDLng = Math.sin(dLng/2);
    const h = sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLng*sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
    return R * c;
}

/**
 * 직선 경로를 일정 간격(m)으로 보간하여 LatLng 배열 생성
 */
function densifyLinearPath(start, end, stepMeters = 5) {
    const total = distanceMeters(start, end);
    const steps = Math.max(2, Math.floor(total / stepMeters));
    const out = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        out.push(new kakao.maps.LatLng(
            lerp(start.getLat(), end.getLat(), t),
            lerp(start.getLng(), end.getLng(), t)
        ));
    }
    return out;
}

/**
 * 도보 경로 그리기 + 애니메이션 (REST Directions 없을 경우 직선 보간 대체)
 */
async function showWalkingRoute(map, start, end) {
    clearRoute(map);
    let path = null;
    // 시작과 목적지가 동일하면 애니메이션 불필요 (디버그 메시지 출력 후 종료)
    if (start.getLat() === end.getLat() && start.getLng() === end.getLng()) {
        console.warn('[JJU Walk] 시작 지점과 목적지가 동일하여 이동하지 않습니다.');
        return;
    }
    
    // 🔊 경로 시작 사운드 재생
    SoundEffects.playRouteStart();
    // 서버 프록시가 제공되면 실제 도보 길찾기 경로 사용 시도
    if (DIRECTIONS_API) {
        try {
            const qs = new URLSearchParams({
                origin: `${start.getLng()},${start.getLat()}`,
                destination: `${end.getLng()},${end.getLat()}`,
                mode: 'walk'
            }).toString();
            const res = await fetch(`${DIRECTIONS_API}?${qs}`, { method: 'GET' });
            if (res.ok) {
                const json = await res.json();
                if (json && Array.isArray(json.path) && json.path.length >= 2) {
                    path = json.path.map(p => new kakao.maps.LatLng(p.lat, p.lng));
                }
            }
        } catch (e) {
            console.warn('Directions API 실패, 직선 경로로 대체합니다.', e);
        }
    }
    // 실패/미설정 시 직선 보간 경로 사용
    if (!path) {
        path = densifyLinearPath(start, end, 4);
    }
    // 파란색 실선 Polyline 생성
    MapState.route.polyline = new kakao.maps.Polyline({
        map,
        path,
        strokeWeight: 5,
        strokeColor: '#4c6ef5',
        strokeOpacity: 0.9,
        strokeStyle: 'solid'
    });

    // Polyline에 부드러운 그림자 효과 추가 (DOM 직접 조작)
    setTimeout(() => {
        const polylineElement = MapState.route.polyline?.getNode?.();
        if (polylineElement) {
            const pathEl = polylineElement.querySelector('path');
            if (pathEl) {
                pathEl.style.filter = 'drop-shadow(0 2px 4px rgba(76, 110, 245, 0.3))';
            }
        }
    }, 100);

    // 워커 마커 생성 및 경로 애니메이션
    MapState.route.animMarker = createWalkerMarker(start);
    MapState.route.animMarker.setMap(map);
    const speed = 1.25 * 40; // 초고속 애니메이션 (50m/s)
    const totalDistance = distanceMeters(start, end);
    const duration = Math.max(300, Math.min(2000, (totalDistance / speed) * 1000)); // 0.3초~2초 범위
    const walkTimeMinutes = Math.ceil(totalDistance / (4 * 1000 / 60)); // 4km/h 기준

    if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE) {
        console.log('[JJU Walk] path length=', path.length, 'duration(ms)=', duration.toFixed(0));
    }

    // 경로 정보 패널 표시
    showRouteInfoPanel(totalDistance, walkTimeMinutes);

    animateMarkerAlongPath(MapState.route.animMarker, path, duration, () => {
        // 🔊 도착 사운드 재생
        SoundEffects.playRouteComplete();
        // 도착 시 살짝 바운스
        try { bounceMarker(MapState.route.animMarker, 8, 400); } catch(_){}
        if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE) {
            console.log('[JJU Walk] 경로 애니메이션 완료');
        }
        // 도착 후에도 경로 정보 패널은 유지 (경로가 사라질 때까지)
    }, map); // map 파라미터 전달

    // 경로 전체가 보이도록 범위 조정
    const bounds = new kakao.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    map.setBounds(bounds, 40, 40, 40, 40);
}

/**
 * 카카오맵 Places API를 이용해 키워드로 장소를 검색하는 함수입니다.
 * - keyword: 검색할 키워드(예: "음식점", "약국" 등)
 * - map: 지도 객체
 * - callback: 검색 결과를 처리할 함수
 * - skipCache: 캐시 무시 여부
 */
async function searchPlacesByKeyword(keyword, map, callback, skipCache = false) {
    // 스켈레톤 로딩 표시
    showSkeletonLoading('places-list', 5);
    
    // 캐시 확인 (서버 캐시)
    if (!skipCache && JJUApi.userId) {
        try {
            const cached = await JJUApi.getCachedSearch(keyword);
            if (cached && cached.length > 0) {
                console.log(`[Cache] Using cached results for "${keyword}"`);
                // 즐겨찾기 상태 확인
                const placeIds = cached.map(p => p.id);
                await JJUApi.checkFavorites(placeIds);
                callback(cached);
                return;
            }
        } catch (e) {
            console.warn('[Cache] 캐시 확인 실패:', e);
        }
    }
    
    try {
        // Places 서비스 객체 생성
        const ps = new kakao.maps.services.Places();

        // 전주대학교 중심 좌표 기준으로 검색
        const center = map.getCenter();

        // 검색 옵션: 중심 좌표와 반경 (2km로 확대)
        const options = {
            location: center,
            radius: 2000,
            size: 15 // 한 페이지에 최대 15개
        };

        let allResults = [];

        // 키워드로 장소 검색 (페이지네이션 처리)
        ps.keywordSearch(keyword, async function(data, status, pagination) {
            if (status === kakao.maps.services.Status.OK) {
                allResults = allResults.concat(data);
                
                // 다음 페이지가 있고, 현재 페이지가 3 이하면 더 가져오기
                if (pagination.hasNextPage && pagination.current < 3) {
                    pagination.nextPage();
                } else {
                    // 모든 결과 수집 완료 - 캐시 저장
                    try {
                        await JJUApi.setCachedSearch(keyword, allResults);
                        // 즐겨찾기 상태 확인
                        const placeIds = allResults.map(p => p.id);
                        await JJUApi.checkFavorites(placeIds);
                    } catch (e) {
                        console.warn('[Cache] 캐시 저장 실패:', e);
                    }
                    callback(allResults);
                }
            } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                callback([]);
            } else {
                console.error('장소 검색 실패:', status);
                showErrorUI('search-failed');
                callback([]);
            }
        }, options);
    } catch (e) {
        console.error('검색 중 오류:', e);
        showErrorUI('search-failed');
        callback([]);
    }
}

/**
 * 왼쪽 사이드바에 장소 목록을 표시하는 함수입니다.
 * - results: Places API에서 받은 장소 배열
 * - map: 지도 객체
 */
function displayPlacesList(results, map) {
    const listContainer = document.getElementById('places-list');
    if (!listContainer) return;

    // 현재 결과 저장 (즐겨찾기 토글 시 사용)
    MapState.currentResults = results;

    // 기존 목록 초기화
    listContainer.innerHTML = '';

    // 결과 개수 업데이트 (새로운 UI용)
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = results.length + '개';
    }

    // 각 장소를 목록으로 표시
    results.forEach((place, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'result-item';

        // 카테고리명 추출 (마지막 카테고리)
        const categoryText = place.category_name ?
            place.category_name.split(' > ').pop() : '';
        
        // 즐겨찾기 여부 확인
        const placeId = place.id || place.place_id;
        const isFavorite = MapState.favorites.has(placeId);

        // 장소 정보 HTML (즐겨찾기 버튼 포함)
        itemDiv.innerHTML = `
            <div class="result-item-header">
                <h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${place.place_name}
                    ${categoryText ? `<span class="category-badge">${categoryText}</span>` : ''}
                </h3>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        data-place-id="${placeId}" 
                        data-index="${index}"
                        title="${isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? '#ff6b6b' : 'none'}" stroke="${isFavorite ? '#ff6b6b' : 'currentColor'}" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <p>${place.road_address_name || place.address_name}</p>
            ${place.phone ? `<p>${place.phone}</p>` : ''}
        `;
        
        // 즐겨찾기 버튼 클릭 이벤트
        const favBtn = itemDiv.querySelector('.favorite-btn');
        favBtn.onclick = async (e) => {
            e.stopPropagation(); // 부모 클릭 이벤트 방지
            
            const btn = e.currentTarget;
            btn.disabled = true;
            
            try {
                const result = await JJUApi.toggleFavorite(place);
                if (result) {
                    const isNowFavorite = MapState.favorites.has(placeId);
                    btn.classList.toggle('active', isNowFavorite);
                    btn.title = isNowFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가';
                    
                    // 아이콘 업데이트
                    const svg = btn.querySelector('svg');
                    svg.setAttribute('fill', isNowFavorite ? '#ff6b6b' : 'none');
                    svg.setAttribute('stroke', isNowFavorite ? '#ff6b6b' : 'currentColor');
                    
                    // 피드백 사운드
                    SoundEffects.playClick();
                    
                    // 토스트 메시지
                    showToast(result.message);
                }
            } catch (e) {
                console.error('즐겨찾기 토글 실패:', e);
            } finally {
                btn.disabled = false;
            }
        };
        
        // 아이템 클릭 시 해당 마커로 이동 및 인포윈도우 표시
        itemDiv.onclick = (e) => {
            // 즐겨찾기 버튼 클릭은 무시
            if (e.target.closest('.favorite-btn')) return;
            
            // 🔊 클릭 사운드 재생
            SoundEffects.playClick();
            
            const markerPosition = new kakao.maps.LatLng(place.y, place.x);
            // 스무스 이동 및 줌
            if (map && typeof map.panTo === 'function') {
                map.panTo(markerPosition);
            } else {
                map.setCenter(markerPosition);
            }
            if (typeof map.setLevel === 'function') {
                try { map.setLevel(3, { animate: true }); } catch (_) { map.setLevel(3); }
            }
            
            // 해당 마커의 인포윈도우 표시 (즐겨찾기 버튼 포함)
            const infoIsFavorite = MapState.favorites.has(placeId);
            const content = createInfoWindowContent(place, index, infoIsFavorite);
            
            if (MapState.infowindow) {
                MapState.infowindow.setContent(content);
                MapState.infowindow.open(map, MapState.markers[index]);
            }

            // 리플 + 바운스
            showRippleEffect(map, markerPosition);
            if (MapState.markers[index]) bounceMarker(MapState.markers[index]);

            // 도보 경로 애니메이션 (시작 지점이 설정된 경우)
            if (MapState.route.startPosition) {
                showWalkingRoute(map, MapState.route.startPosition, markerPosition);
            } else {
                // 시작 지점 미설정 시 간단 데모
                try {
                    const start = map.getCenter();
                    const dot = createDotMarker(start);
                    dot.setMap(map);
                    animateMarkerAlongPath(dot, [start, markerPosition], 900, () => {
                        dot.setMap(null);
                    });
                } catch (_) { /* noop */ }
            }
        };
        
        listContainer.appendChild(itemDiv);
    });
}

/**
 * 인포윈도우 콘텐츠 생성 (즐겨찾기 버튼 포함)
 * - 프로젝트 스타일과 일관된 디자인 적용
 */
function createInfoWindowContent(place, index, isFavorite) {
    const placeId = place.id || place.place_id;
    const categoryText = place.category_name ? place.category_name.split(' > ').pop() : '';
    
    return `
        <div class="jju-infowindow">
            <div class="jju-infowindow-header">
                <div class="jju-infowindow-title">${place.place_name}</div>
                <button class="jju-infowindow-fav ${isFavorite ? 'active' : ''}"
                        onclick="toggleInfoWindowFavorite('${placeId}', ${index}, this)" 
                        title="${isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite ? '#ff6b6b' : 'none'}" stroke="${isFavorite ? '#ff6b6b' : '#adb5bd'}" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="jju-infowindow-address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${place.road_address_name || place.address_name}
            </div>
            ${place.phone ? `
                <div class="jju-infowindow-phone">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    ${place.phone}
                </div>
            ` : ''}
            ${categoryText ? `<span class="jju-infowindow-badge">${categoryText}</span>` : ''}
            ${place.place_url ? `
                <a href="${place.place_url}" target="_blank" class="jju-infowindow-link">
                    상세보기
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            ` : ''}
        </div>
    `;
}

/**
 * 인포윈도우 내 즐겨찾기 토글 (전역 함수)
 */
window.toggleInfoWindowFavorite = async function(placeId, index, btnElement) {
    const place = MapState.currentResults[index];
    if (!place) return;
    
    try {
        const result = await JJUApi.toggleFavorite(place);
        if (result) {
            const isNowFavorite = MapState.favorites.has(placeId);
            
            // 버튼 아이콘 업데이트
            const svg = btnElement.querySelector('svg');
            svg.setAttribute('fill', isNowFavorite ? '#ff6b6b' : 'none');
            svg.setAttribute('stroke', isNowFavorite ? '#ff6b6b' : '#999');
            btnElement.title = isNowFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가';
            
            // 사이드바 목록도 업데이트
            const listBtn = document.querySelector(`.favorite-btn[data-place-id="${placeId}"]`);
            if (listBtn) {
                listBtn.classList.toggle('active', isNowFavorite);
                const listSvg = listBtn.querySelector('svg');
                listSvg.setAttribute('fill', isNowFavorite ? '#ff6b6b' : 'none');
                listSvg.setAttribute('stroke', isNowFavorite ? '#ff6b6b' : 'currentColor');
            }
            
            SoundEffects.playClick();
            showToast(result.message);
        }
    } catch (e) {
        console.error('즐겨찾기 토글 실패:', e);
    }
};

/**
 * 토스트 메시지 표시
 */
function showToast(message, duration = 2000) {
    // 기존 토스트 제거
    const existing = document.querySelector('.jju-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'jju-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 애니메이션
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * 카테고리에 따른 이모지 반환 함수
 * - categoryName: 카테고리 이름
 */
function getCategoryEmoji(categoryName) {
    if (!categoryName) return '🏪';
    if (categoryName.includes('한식')) return '🍚';
    if (categoryName.includes('중식')) return '🥟';
    if (categoryName.includes('일식')) return '🍣';
    if (categoryName.includes('양식')) return '🍕';
    if (categoryName.includes('분식')) return '🍢';
    if (categoryName.includes('카페')) return '☕';
    if (categoryName.includes('편의점')) return '🏪';
    if (categoryName.includes('약국')) return '💊';
    if (categoryName.includes('병원')) return '🏥';
    return '📍';
}

/**
 * 검색 결과를 지도에 마커로 표시하는 함수입니다.
 * - results: Places API에서 받은 장소 배열
 * - map: 지도 객체
 */
function displayMarkers(results, map) {
    // 기존 마커들을 모두 제거
    clearMarkers();
    
    // 인포윈도우가 없으면 생성 (재사용을 위해 한 번만 생성)
    if (!MapState.infowindow) {
        MapState.infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
    }
    
    // infowindow 지역 변수로 참조 (기존 코드 호환)
    const infowindow = MapState.infowindow;
    
    // 검색 결과가 없을 경우
    if (results.length === 0) {
        showErrorUI('no-results');
        return;
    }
    
    // 🔊 검색 성공 사운드 재생
    SoundEffects.playSearchComplete();
    
    // 왼쪽 사이드바에 목록 표시
    displayPlacesList(results, map);
    
    // 지도 크기 재조정 먼저 수행
    map.relayout();
    
    // 마커들을 표시할 영역을 계산하기 위한 LatLngBounds 객체 생성
    const bounds = new kakao.maps.LatLngBounds();
    
    // 새로운 검색 결과로 마커 생성
    results.forEach((place, index) => {
        const markerPosition = new kakao.maps.LatLng(place.y, place.x);
        const marker = new kakao.maps.Marker({
            position: markerPosition
        });

        // 마커를 지도에 표시
        marker.setMap(map);
        // 드롭 애니메이션 (살짝 스태거)
        setTimeout(() => dropMarker(marker, markerPosition, 600, 35), 20 * index);
        
        // 생성된 마커를 배열에 추가
        MapState.markers.push(marker);
        
        // bounds에 마커 위치 추가
        bounds.extend(markerPosition);

        // 마커 클릭 시 인포윈도우 표시 (인포윈도우 재사용으로 성능 개선)
        kakao.maps.event.addListener(marker, 'click', function() {
            // 🔊 클릭 사운드 재생
            SoundEffects.playClick();
            
            // 즐겨찾기 여부 확인
            const placeId = place.id || place.place_id;
            const isFavorite = MapState.favorites.has(placeId);
            
            // 상세 정보 HTML 생성 (즐겨찾기 버튼 포함)
            const content = createInfoWindowContent(place, index, isFavorite);
            infowindow.setContent(content);
            infowindow.open(map, marker);

            // 리플 + 바운스 + 부드러운 이동
            showRippleEffect(map, markerPosition);
            bounceMarker(marker);
            if (map && typeof map.panTo === 'function') map.panTo(markerPosition);

            // 도보 경로 애니메이션 (시작 지점이 설정된 경우)
            if (MapState.route.startPosition) {
                showWalkingRoute(map, MapState.route.startPosition, markerPosition);
            }
        });
    });
    
    // 모든 마커가 보이도록 지도 범위 재설정 (padding 추가)
    const padding = 50; // 여유 공간
    map.setBounds(bounds, padding, padding, padding, padding);
}

/**
 * 여러 키워드로 검색하고 결과를 통합하는 함수입니다.
 * - keywords: 검색할 키워드 배열
 * - map: 지도 객체
 * - callback: 검색 완료 후 실행할 함수
 */
function searchMultipleKeywords(keywords, map, callback) {
    const ps = new kakao.maps.services.Places();
    const center = map.getCenter();
    const options = { 
        location: center, 
        radius: 2000,
        size: 15
    };
    
    let allResults = [];
    let completedCount = 0;
    
    keywords.forEach(keyword => {
        ps.keywordSearch(keyword, function(data, status) {
            completedCount++;
            if (status === kakao.maps.services.Status.OK) {
                allResults = allResults.concat(data);
            }
            
            // 모든 검색이 완료되면 콜백 실행
            if (completedCount === keywords.length) {
                // 중복 제거 (같은 place_id는 하나만)
                const uniqueResults = Array.from(
                    new Map(allResults.map(item => [item.id, item])).values()
                );
                callback(uniqueResults);
            }
        }, options);
    });
}

/**
 * 모든 음식 카테고리를 검색하는 함수 (food.html 전용)
 * - map: 지도 객체
 */
function searchAllFoodCategories(map) {
    searchMultipleKeywords(["한식", "중식", "일식", "양식", "분식", "카페"], map, function(results) {
        displayMarkers(results, map);
    });
}

/**
 * 카테고리 버튼 클릭 또는 검색어 입력 시 해당 키워드로 장소 검색 및 마커 표시
 * - keyword: 검색할 키워드
 * - map: 지도 객체
 */
function searchAndDisplay(keyword, map) {
    // "음식점" 키워드는 모든 음식 카테고리 통합 검색
    if (keyword === "음식점") {
        searchMultipleKeywords(["한식", "중식", "일식", "양식", "분식", "카페"], map, function(results) {
            displayMarkers(results, map);
        });
    } else {
        // 일반 키워드는 단일 검색
        searchPlacesByKeyword(keyword, map, function(results) {
            displayMarkers(results, map);
        });
    }
}

// ============================================
// 즐겨찾기 패널 UI
// ============================================

/**
 * 즐겨찾기 패널 생성
 */
function createFavoritesPanel() {
    if (document.getElementById('favorites-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'favorites-panel';
    panel.className = 'favorites-panel';
    panel.innerHTML = `
        <div class="favorites-panel-header">
            <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff6b6b" stroke="#ff6b6b" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                즐겨찾기
            </h2>
            <button class="favorites-panel-close" onclick="closeFavoritesPanel()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="favorites-panel-content" id="favorites-list">
            <div class="favorites-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <p>아직 즐겨찾기가 없습니다.<br>마음에 드는 장소에 하트를 눌러보세요!</p>
            </div>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.id = 'favorites-overlay';
    overlay.className = 'favorites-overlay';
    overlay.onclick = closeFavoritesPanel;
    
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
}

/**
 * 즐겨찾기 패널 열기
 */
async function openFavoritesPanel(map) {
    createFavoritesPanel();
    
    const panel = document.getElementById('favorites-panel');
    const overlay = document.getElementById('favorites-overlay');
    const listContainer = document.getElementById('favorites-list');
    
    // 패널 열기
    setTimeout(() => {
        panel.classList.add('open');
        overlay.classList.add('show');
    }, 10);
    
    // 즐겨찾기 목록 로드
    listContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p class="loading-text">불러오는 중...</p></div>';
    
    try {
        const favorites = await JJUApi.getFavorites();
        
        if (favorites.length === 0) {
            listContainer.innerHTML = `
                <div class="favorites-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <p>아직 즐겨찾기가 없습니다.<br>마음에 드는 장소에 하트를 눌러보세요!</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = favorites.map((fav, index) => `
            <div class="favorite-item" data-place-id="${fav.place_id}" data-lat="${fav.lat}" data-lng="${fav.lng}" data-index="${index}">
                <div class="favorite-item-info">
                    <div class="favorite-item-name">${fav.place_name}</div>
                    <div class="favorite-item-address">${fav.address || ''}</div>
                    ${fav.category ? `<div class="favorite-item-category">${fav.category.split(' > ').pop()}</div>` : ''}
                </div>
                <button class="favorite-item-remove" onclick="event.stopPropagation(); removeFavoriteFromPanel('${fav.place_id}', this)" title="즐겨찾기 해제">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `).join('');
        
        // 아이템 클릭 이벤트 (지도로 이동)
        listContainer.querySelectorAll('.favorite-item').forEach(item => {
            item.onclick = () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                
                if (map && lat && lng) {
                    const position = new kakao.maps.LatLng(lat, lng);
                    map.panTo(position);
                    map.setLevel(3);
                    showRippleEffect(map, position);
                    closeFavoritesPanel();
                    SoundEffects.playClick();
                }
            };
        });
        
    } catch (error) {
        console.error('즐겨찾기 로드 실패:', error);
        listContainer.innerHTML = '<div class="favorites-empty"><p>즐겨찾기를 불러올 수 없습니다.</p></div>';
    }
}

/**
 * 즐겨찾기 패널 닫기
 */
function closeFavoritesPanel() {
    const panel = document.getElementById('favorites-panel');
    const overlay = document.getElementById('favorites-overlay');
    
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
}

/**
 * 패널에서 즐겨찾기 제거
 */
window.removeFavoriteFromPanel = async function(placeId, btnElement) {
    const result = await JJUApi.removeFavorite(placeId);
    
    if (result && result.success) {
        const item = btnElement.closest('.favorite-item');
        if (item) {
            item.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => item.remove(), 300);
        }
        
        // 사이드바 목록도 업데이트
        const listBtn = document.querySelector(`.favorite-btn[data-place-id="${placeId}"]`);
        if (listBtn) {
            listBtn.classList.remove('active');
            const svg = listBtn.querySelector('svg');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
        }
        
        SoundEffects.playClick();
        showToast(result.message);
        
        // 빈 목록 체크
        setTimeout(() => {
            const listContainer = document.getElementById('favorites-list');
            if (listContainer && !listContainer.querySelector('.favorite-item')) {
                listContainer.innerHTML = `
                    <div class="favorites-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <p>아직 즐겨찾기가 없습니다.<br>마음에 드는 장소에 하트를 눌러보세요!</p>
                    </div>
                `;
            }
        }, 350);
    }
};

/**
 * 즐겨찾기 버튼 생성 (네비게이션 또는 사이드바에 추가)
 */
function createFavoritesButton(map) {
    // 이미 있으면 스킵
    if (document.getElementById('favorites-toggle')) return;
    
    const btn = document.createElement('button');
    btn.id = 'favorites-toggle';
    btn.className = 'favorites-toggle-btn';
    btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        즐겨찾기
        <span class="count" id="favorites-count" style="display:none;">0</span>
    `;
    
    btn.onclick = () => openFavoritesPanel(map);
    
    // 삽입 위치 결정 (사이드바 헤더 또는 네비게이션)
    const sidebarHeader = document.querySelector('.sidebar-header');
    const navbarRight = document.querySelector('.navbar-right');
    
    if (sidebarHeader) {
        sidebarHeader.appendChild(btn);
    } else if (navbarRight) {
        navbarRight.insertBefore(btn, navbarRight.firstChild);
    } else {
        // 폴백: 사운드 버튼 옆에 고정
        btn.style.cssText = 'position:fixed;bottom:20px;right:80px;z-index:1000;';
        document.body.appendChild(btn);
    }
    
    // 즐겨찾기 카운트 업데이트
    updateFavoritesCount();
}

/**
 * 즐겨찾기 카운트 업데이트
 */
async function updateFavoritesCount() {
    const countEl = document.getElementById('favorites-count');
    if (!countEl) return;
    
    try {
        const favorites = await JJUApi.getFavorites();
        const count = favorites.length;
        
        countEl.textContent = count;
        countEl.style.display = count > 0 ? 'inline' : 'none';
    } catch (e) {
        // 무시
    }
}

/**
 * 페이지가 모두 로드되면 지도 초기화 및 이벤트 리스너 등록
 */
window.onload = function() {
    // 자동 초기화/검색은 각 페이지에서 수행합니다.
};
