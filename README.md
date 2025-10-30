# jju-compass-map
전주대학교 주변 시설 정보를 지도 형태로 제공하기 위한 정적 웹 프로젝트입니다.  
현재 저장소는 향후 구현을 위한 뼈대만 남겨 두었으며, 프로젝트 구조와 배포 환경을 이해하기 쉽게 문서화했습니다.

## 프로젝트 개요
- **목적**: 음식점, 카페, 편의시설 등 전주대 주변 시설을 카카오맵을 통해 빠르게 탐색할 수 있는 웹 서비스 구축
- **구성**: HTML/CSS/JavaScript 기반의 정적 페이지. Kakao Maps JavaScript SDK 연동을 전제로 합니다.
- **상태**: 메인 페이지(`index.html`)는 안내 문구만 포함하고 있으며, 기타 페이지와 자산은 `TODO` 주석으로만 구성된 플레이스홀더입니다.

## 저장소 구조
```
├── index.html          # 메인 페이지(설명 문구만 존재)
├── about.html          # 서비스 소개 페이지(추후 구현 예정, TODO 주석만 존재)
├── guide.html          # 이용 가이드 페이지(추후 구현 예정)
├── search.html         # 검색 결과 페이지(추후 구현 예정)
├── food*.html          # 음식점 관련 카테고리 페이지 6종(추후 구현 예정)
├── cafe.html           # 카페 카테고리 페이지(추후 구현 예정)
├── convenience.html    # 편의점 카테고리 페이지(추후 구현 예정)
├── pharmacy.html       # 약국 카테고리 페이지(추후 구현 예정)
├── hospital.html       # 병원 카테고리 페이지(추후 구현 예정)
├── bank.html           # 은행/ATM 페이지(추후 구현 예정)
├── stationery.html     # 문구점 페이지(추후 구현 예정)
├── salon.html          # 미용실 페이지(추후 구현 예정)
├── pcroom.html         # PC방 페이지(추후 구현 예정)
├── gym.html            # 헬스장 페이지(추후 구현 예정)
├── karaoke.html        # 노래방 페이지(추후 구현 예정)
├── style.css           # 공통 스타일 파일(현재는 TODO 주석만 존재)
├── map.js              # Kakao 지도 초기화 스크립트(현재는 TODO 주석만 존재)
└── README.md           # 프로젝트 설명 문서(본 문서)
```

## 구현 방식 요약
- 모든 페이지는 정적 HTML로 작성하며, 필요 시 `style.css`와 `map.js`에서 공통 스타일과 지도 로직을 참조합니다.
- Kakao Maps JavaScript SDK를 사용해 메인 페이지에서 지도를 초기화하고, 각 카테고리 페이지는 동일한 방식으로 마커 데이터를 표시할 예정입니다.
- 추가 도구나 프레임워크 없이 순수 HTML/CSS/JS로 유지하여 서버 측 구성은 단순 정적 서빙으로 마무리합니다.

## 동작 개요
1. 사용자가 HTML 페이지에 접속하면 정적 자산(`style.css`, `map.js`)이 함께 로드됩니다.
2. `map.js`는 Kakao Maps SDK를 이용해 기본 지도를 초기화하고, 준비된 시설 데이터(JSON/JS)를 읽어 마커와 인포윈도우를 생성합니다.
3. 각 카테고리 페이지는 동일한 로직에 서로 다른 데이터 세트를 주입하여, 선택한 카테고리의 시설만 지도에 표시하도록 구성할 예정입니다.
4. 추가 인터랙션(목록 클릭 시 지도 이동, 필터 버튼 등)도 모두 클라이언트 사이드 JavaScript로 처리합니다.

## 서버 환경(Oracle Cloud)
- **OS**: Ubuntu 22.04 LTS
- **웹 서버**: Nginx 1.18
- **프로젝트 경로**: `/home/ubuntu/jju-compass-map`
- **Nginx 가상호스트 설정**: `/etc/nginx/sites-available/jju-compass`
  ```nginx
  server {
      listen 80;
      server_name 134.185.117.30;

      root /home/ubuntu/jju-compass-map;
      index index.html;

      location / {
          try_files $uri $uri/ =404;
      }
  }
  ```
- **공개 접속 URL**: http://134.185.117.30/ (Oracle Cloud 퍼블릭 IP). 정적 파일을 배포하면 이 주소에서 바로 확인할 수 있습니다.
