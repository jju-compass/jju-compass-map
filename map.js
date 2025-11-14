/**
 * Kakao Maps API를 이용해 지도 영역을 초기화하는 함수입니다.
 * - 지도는 전주대학교를 중심으로 표시됩니다.
 * - 지도 표시 영역은 반드시 id="map"인 div 요소여야 합니다.
 * - Kakao Maps SDK가 먼저 로드되어 있어야 정상 동작합니다.
 */
function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('지도를 표시할 #map 요소가 없습니다. HTML에 <div id="map"></div>를 추가하세요.');
        return;
    }

    const mapOption = {
        center: new kakao.maps.LatLng(35.814445811028584, 127.09236571436321), // 전주대학교 공학 1관 좌표
        level: 4
    };

    const map = new kakao.maps.Map(mapContainer, mapOption);
    
    // 모바일에서 지도 크기가 올바르게 계산되도록 relayout 호출
    setTimeout(() => {
        map.relayout();
    }, 100);

    // 도보 경로 컨트롤 UI 부착
    try { attachRouteControls(map); } catch (_) {}

    return map;
}

// 현재 지도에 표시된 마커들을 저장하는 배열
let markers = [];

// 재사용할 인포윈도우 객체 (성능 최적화)
let infowindow = null;

    // 활성화된 커스텀 오버레이(리플 등)를 추적하여 정리
    let transientOverlays = [];
    let userStartPosition = null; // kakao.maps.LatLng or null
    let userStartMarker = null;   // kakao.maps.Marker or null
    let routePolyline = null;     // kakao.maps.Polyline or null
    let routeAnimMarker = null;   // kakao.maps.Marker or null
    let pickingStart = false;     // 지도 클릭으로 시작 지점 선택 모드
    let mapPickClickHandler = null; // 이벤트 해제용 참조
    // 선택: 서버에 구현한 도보 길찾기 프록시 API 엔드포인트를 window.JJU_DIRECTIONS_API로 주입하면 사용합니다.
    const DIRECTIONS_API = (typeof window !== 'undefined' && window.JJU_DIRECTIONS_API) ? window.JJU_DIRECTIONS_API : null;

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
     */
    function animateMarkerAlongPath(marker, path, duration = 2000, onDone) {
        if (!Array.isArray(path) || path.length < 2) return;
        const start = performance.now();
        function interp(p0, p1, t) {
            return new kakao.maps.LatLng(
                lerp(p0.getLat(), p1.getLat(), t),
                lerp(p0.getLng(), p1.getLng(), t)
            );
        }
        function step(now) {
            const t = Math.min(1, (now - start) / duration);
            // 구간 수에 비례하여 진행
            const segCount = path.length - 1;
            const ft = t * segCount;
            const i = Math.min(segCount - 1, Math.floor(ft));
            const localT = ft - i;
            const pos = interp(path[i], path[i + 1], localT);
            marker.setPosition(pos);
            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                marker.setPosition(path[path.length - 1]);
                if (typeof onDone === 'function') onDone();
            }
        }
        requestAnimationFrame(step);
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
        transientOverlays.push(overlay);
        // 애니메이션 종료 후 제거
        setTimeout(() => {
            overlay.setMap(null);
            transientOverlays = transientOverlays.filter(o => o !== overlay);
        }, 650);
    }

/**
 * 지도에 표시된 모든 마커를 제거하는 함수입니다.
 * - 메모리 누수 방지를 위해 이벤트 리스너도 함께 제거합니다.
 */
function clearMarkers() {
    // 인포윈도우 닫기
    if (infowindow) {
        infowindow.close();
    }
    
    // 모든 마커 제거
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
        // 임시 오버레이 제거
        transientOverlays.forEach(o => o.setMap(null));
        transientOverlays = [];
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
 * 워커(사람) 마커 이미지 생성
 */
function createWalkerMarker(position) {
    // 기존 MarkerImage 대신 커스텀 오버레이로 귀여운 걷는 캐릭터 구현
    const el = document.createElement('div');
    el.className = 'walker-avatar';
    el.innerHTML = `
        <div class="walker-body">
            <div class="walker-head"></div>
            <div class="walker-torso"></div>
            <div class="walker-arm walker-arm-left"></div>
            <div class="walker-arm walker-arm-right"></div>
            <div class="walker-leg walker-leg-left"></div>
            <div class="walker-leg walker-leg-right"></div>
        </div>
    `;
    return new kakao.maps.CustomOverlay({
        position,
        content: el,
        yAnchor: 0.5,
        zIndex: 7
    });
}

/**
 * 시작 지점 설정 및 워커 마커 표시/업데이트
 */
function setStartPosition(map, latLng) {
    userStartPosition = latLng;
    if (userStartMarker) {
        userStartMarker.setPosition(latLng);
    } else {
        userStartMarker = createWalkerMarker(latLng);
        userStartMarker.setMap(map);
    }
    showRippleEffect(map, latLng, '#2e7d32');
}

/**
 * 지도 클릭으로 시작 지점 지정 모드 토글
 */
function toggleStartPickMode(map, enable) {
    pickingStart = enable;
    if (enable) {
        if (!mapPickClickHandler) {
            mapPickClickHandler = function(e) {
                setStartPosition(map, e.latLng);
                toggleStartPickMode(map, false);
                alert('시작 지점이 설정되었습니다. 목적지를 클릭하면 경로가 재생됩니다.');
            };
        }
        kakao.maps.event.addListener(map, 'click', mapPickClickHandler);
    } else if (mapPickClickHandler) {
        kakao.maps.event.removeListener(map, 'click', mapPickClickHandler);
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
        <button class="rc-btn" id="rc-geoloc">내 위치 시작</button>
        <button class="rc-btn" id="rc-pick">시작 지점 지정</button>
        <button class="rc-btn" id="rc-clear">경로 지우기</button>
    `;
    document.body.appendChild(controls);
    document.getElementById('rc-geoloc').onclick = () => setStartFromGeolocation(map);
    document.getElementById('rc-pick').onclick = () => {
        toggleStartPickMode(map, !pickingStart);
        alert(pickingStart ? '지도를 클릭하여 시작 지점을 선택하세요.' : '시작 지점 지정 모드를 종료합니다.');
    };
    document.getElementById('rc-clear').onclick = () => clearRoute(map);
}

/** 경로/애니메이션 정리 */
function clearRoute(map) {
    if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
    if (routeAnimMarker) { routeAnimMarker.setMap(null); routeAnimMarker = null; }
    // 시작 마커는 유지
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
    routePolyline = new kakao.maps.Polyline({
        map,
        path,
        strokeWeight: 5,
        strokeColor: '#2E7D32',
        strokeOpacity: 0.9,
        strokeStyle: 'shortdash'
    });
    // 워커 마커 생성 및 경로 애니메이션
    routeAnimMarker = createWalkerMarker(start);
    routeAnimMarker.setMap(map);
    const speed = 1.25 * 3; // 기존 대비 3배 속도 (m/s)
    const duration = Math.max(800, (distanceMeters(start, end) / speed) * 1000);
    animateMarkerAlongPath(routeAnimMarker, path, duration, () => {
        // 도착 시 살짝 바운스
        try { bounceMarker(routeAnimMarker, 8, 400); } catch(_){}
    });
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
            callback([]);
        }
    }, options);
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
    
    // 검색 결과 개수 표시
    const countDiv = document.createElement('div');
    countDiv.style.cssText = 'padding:15px;background:#f8f9fa;border-bottom:2px solid #dee2e6;font-weight:bold;color:#333;';
    countDiv.innerHTML = `검색 결과: ${results.length}개`;
    listContainer.appendChild(countDiv);
    
    // 각 장소를 목록으로 표시
    results.forEach((place, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'place-item';
        itemDiv.style.cssText = `
            padding:15px;
            border-bottom:1px solid #e0e0e0;
            cursor:pointer;
            transition:background 0.2s;
        `;
        
        // 호버 효과
        itemDiv.onmouseenter = () => itemDiv.style.background = '#f8f9fa';
        itemDiv.onmouseleave = () => itemDiv.style.background = 'white';
        
        // 장소 정보 HTML
        itemDiv.innerHTML = `
            <div style="display:flex;align-items:start;gap:10px;">
                <div style="flex-shrink:0;width:60px;height:60px;background:#e9ecef;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">
                    ${getCategoryEmoji(place.category_name)}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:bold;font-size:14px;margin-bottom:3px;color:#333;">
                        ${index + 1}. ${place.place_name}
                    </div>
                    <div style="font-size:12px;color:#666;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        ${place.road_address_name || place.address_name}
                    </div>
                    ${place.phone ? `<div style="font-size:11px;color:#888;">📞 ${place.phone}</div>` : ''}
                </div>
            </div>
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
            infowindow.setContent(content);
            infowindow.open(map, markers[index]);

            // 리플 + 바운스
            showRippleEffect(map, markerPosition);
            if (markers[index]) bounceMarker(markers[index]);

            // 도보 경로 애니메이션 (시작 지점이 설정된 경우)
            if (userStartPosition) {
                showWalkingRoute(map, userStartPosition, markerPosition);
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
    if (!infowindow) {
        infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
    }
    
    // 검색 결과가 없을 경우
    if (results.length === 0) {
        alert('검색 결과가 없습니다.');
        const listContainer = document.getElementById('places-list');
        if (listContainer) {
            listContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">검색 결과가 없습니다.</div>';
        }
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
        markers.push(marker);
        
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
            if (userStartPosition) {
                showWalkingRoute(map, userStartPosition, markerPosition);
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
