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
    currentAnimationId: null
};

// 선택: 서버에 구현한 도보 길찾기 프록시 API 엔드포인트
const DIRECTIONS_API = (typeof window !== 'undefined' && window.JJU_DIRECTIONS_API) ? window.JJU_DIRECTIONS_API : null;

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
        <div class="route-info-title">도보 경로</div>
        <div class="route-info-stats">
            <div class="route-info-stat">
                <div class="route-info-stat-icon">📍</div>
                <div class="route-info-stat-label">거리</div>
                <div class="route-info-stat-value">${distanceMeters >= 1000 ? distanceKm + 'km' : distanceM + 'm'}</div>
            </div>
            <div class="route-info-stat">
                <div class="route-info-stat-icon">⏱️</div>
                <div class="route-info-stat-label">시간</div>
                <div class="route-info-stat-value">${timeMinutes}분</div>
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
    const speed = 1.25 * 3; // 기존 대비 3배 속도 (m/s)
    const totalDistance = distanceMeters(start, end);
    const duration = Math.max(800, (totalDistance / speed) * 1000);
    const walkTimeMinutes = Math.ceil(totalDistance / (4 * 1000 / 60)); // 4km/h 기준

    if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE) {
        console.log('[JJU Walk] path length=', path.length, 'duration(ms)=', duration.toFixed(0));
    }

    // 경로 정보 패널 표시
    showRouteInfoPanel(totalDistance, walkTimeMinutes);

    animateMarkerAlongPath(MapState.route.animMarker, path, duration, () => {
        // 도착 시 살짝 바운스
        try { bounceMarker(MapState.route.animMarker, 8, 400); } catch(_){}
        if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE) {
            console.log('[JJU Walk] 경로 애니메이션 완료');
        }
        // 애니메이션 완료 후 정보 패널 숨김
        hideRouteInfoPanel();
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
 */
function searchPlacesByKeyword(keyword, map, callback) {
    // 스켈레톤 로딩 표시
    showSkeletonLoading('places-list', 5);
    
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
        ps.keywordSearch(keyword, function(data, status, pagination) {
            if (status === kakao.maps.services.Status.OK) {
                allResults = allResults.concat(data);
                
                // 다음 페이지가 있고, 현재 페이지가 3 이하면 더 가져오기
                if (pagination.hasNextPage && pagination.current < 3) {
                    pagination.nextPage();
                } else {
                    // 모든 결과 수집 완료
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

        // 장소 정보 HTML
        itemDiv.innerHTML = `
            <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${place.place_name}
                ${categoryText ? `<span class="category-badge">${categoryText}</span>` : ''}
            </h3>
            <p>${place.road_address_name || place.address_name}</p>
            ${place.phone ? `<p>${place.phone}</p>` : ''}
        `;
        
        // 클릭 시 해당 마커로 이동 및 인포윈도우 표시
        itemDiv.onclick = () => {
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
            
            // 해당 마커의 인포윈도우 표시
            const content = `
                <div style="padding:10px;min-width:200px;line-height:1.5;">
                    <div style="font-weight:bold;font-size:14px;margin-bottom:5px;">
                        ${place.place_name}
                    </div>
                    <div style="font-size:12px;color:#666;">
                        ${place.road_address_name || place.address_name}
                    </div>
                    ${place.phone ? `<div style="font-size:12px;color:#666;margin-top:3px;">📞 ${place.phone}</div>` : ''}
                    ${place.category_name ? `<div style="font-size:11px;color:#888;margin-top:3px;">${place.category_name}</div>` : ''}
                    ${place.place_url ? `<div style="margin-top:5px;"><a href="${place.place_url}" target="_blank" style="color:#4CAF50;text-decoration:none;font-size:12px;">상세보기 →</a></div>` : ''}
                </div>
            `;
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
            // 상세 정보 HTML 생성
            const content = `
                <div style="padding:10px;min-width:200px;line-height:1.5;">
                    <div style="font-weight:bold;font-size:14px;margin-bottom:5px;">
                        ${place.place_name}
                    </div>
                    <div style="font-size:12px;color:#666;">
                        ${place.road_address_name || place.address_name}
                    </div>
                    ${place.phone ? `<div style="font-size:12px;color:#666;margin-top:3px;">📞 ${place.phone}</div>` : ''}
                    ${place.category_name ? `<div style="font-size:11px;color:#888;margin-top:3px;">${place.category_name}</div>` : ''}
                    ${place.place_url ? `<div style="margin-top:5px;"><a href="${place.place_url}" target="_blank" style="color:#4CAF50;text-decoration:none;font-size:12px;">상세보기 →</a></div>` : ''}
                </div>
            `;
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

/**
 * 페이지가 모두 로드되면 지도 초기화 및 이벤트 리스너 등록
 */
window.onload = function() {
    // 자동 초기화/검색은 각 페이지에서 수행합니다.
};
