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
        console.log('[DEBUG] 지도 초기화 완료 및 relayout 실행');
    }, 100);

    return map;
}

// 현재 지도에 표시된 마커들을 저장하는 배열
let markers = [];

// 재사용할 인포윈도우 객체 (성능 최적화)
let infowindow = null;

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

    // 검색 옵션: 중심 좌표와 반경(예: 1km)
    const options = {
        location: center,
        radius: 1000
    };

    // 키워드로 장소 검색
    ps.keywordSearch(keyword, function(data, status, pagination) {
        if (status === kakao.maps.services.Status.OK) {
            // 검색 결과를 콜백 함수로 전달
            callback(data);
        } else {
            console.error('장소 검색 실패:', status);
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
            map.setCenter(markerPosition);
            map.setLevel(3); // 줌인
            
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
    
    // 모바일 디버깅용 로그
    console.log(`[DEBUG] 마커 생성 시작: ${results.length}개`);
    console.log('[DEBUG] 지도 객체:', map);
    console.log('[DEBUG] 지도 중심:', map.getCenter().toString());
    
    // 왼쪽 사이드바에 목록 표시
    displayPlacesList(results, map);
    
    // 지도 크기 재조정 (모바일에서 지도 영역이 변경된 후 호출)
    setTimeout(() => {
        map.relayout();
        console.log('[DEBUG] 지도 relayout 완료');
    }, 100);
    
    // 새로운 검색 결과로 마커 생성
    results.forEach((place, index) => {
        const markerPosition = new kakao.maps.LatLng(place.y, place.x);
        const marker = new kakao.maps.Marker({
            position: markerPosition,
            map: map
        });

        // 생성된 마커를 배열에 추가
        markers.push(marker);
        
        console.log(`[DEBUG] 마커 ${index + 1} 생성: ${place.place_name} (${place.y}, ${place.x})`);

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
        });
    });
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
    const options = { location: center, radius: 1000 };
    
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
    const map = initializeMap();

    // 기본: "음식점" 키워드로 검색 및 마커 표시
    if (map) {
        searchAndDisplay("음식점", map);
    }

    // 카테고리 버튼 클릭 이벤트 등록 예시
    // HTML에서 각 버튼에 data-keyword 속성을 넣어주세요.
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const keyword = btn.getAttribute('data-keyword');
            searchAndDisplay(keyword, map);
        });
    });

    // 검색 입력창에서 엔터 시 검색
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            const keyword = searchInput.value.trim();
            if (keyword) {
                searchAndDisplay(keyword, map);
            }
        });
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const keyword = searchInput.value.trim();
                if (keyword) {
                    searchAndDisplay(keyword, map);
                }
            }
        });
    }
};
