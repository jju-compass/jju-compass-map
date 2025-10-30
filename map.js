/* global kakao */

// NOTE: 카카오맵 JavaScript API 스크립트를 index.html에 추가한 뒤 아래 함수를 호출하세요.
// 예: <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY"></script>
(function initMap() {
  const container = document.querySelector(".map-placeholder");
  if (!container) return;

  if (typeof kakao === "undefined" || !kakao.maps) {
    container.classList.add("map-placeholder--inactive");
    container.innerHTML = "<span>카카오맵 API 키를 설정하면 실제 지도가 표시됩니다.</span>";
    return;
  }

  const mapContainer = document.createElement("div");
  mapContainer.className = "kakao-map";
  container.replaceWith(mapContainer);

  const mapOptions = {
    center: new kakao.maps.LatLng(35.846977, 127.129513), // 전주대학교 기준 좌표
    level: 4
  };

  const map = new kakao.maps.Map(mapContainer, mapOptions);

  // 추후 마커/클러스터링을 위한 기본 컨트롤 예시
  const mapTypeControl = new kakao.maps.MapTypeControl();
  map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

  const zoomControl = new kakao.maps.ZoomControl();
  map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

  // 향후 데이터 로딩 시 사용할 자리를 남겨둡니다.
  console.info("JJU Map: Kakao map initialized", map);
})();
