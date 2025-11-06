# jju-compass-map

전주대학교 주변 시설 정보를 카카오맵 기반으로 제공하는 정적 웹 서비스입니다.

## 프로젝트 개요

* **목적**: 전주대학교 주변 음식점(한식, 중식, 일식, 양식, 분식), 편의점, 약국, 병원 등을 카카오맵을 통해 빠르게 탐색
* **구성**: HTML/CSS/JavaScript 기반의 정적 페이지, Kakao Maps JavaScript SDK 연동
* **상태**: 카카오맵 API 연동 완료, 장소 검색 및 마커 표시 기능 구현 완료

## 주요 기능

### ✅ 구현 완료
- 카카오맵 SDK 연동 및 지도 초기화
- Places API를 통한 키워드/카테고리 검색
- 검색 결과 마커 생성 및 지도 표시
- 마커 클릭 시 상세 정보 인포윈도우 표시
  - 장소명, 주소, 전화번호, 카테고리, 카카오맵 링크
- 왼쪽 사이드바에 검색 결과 목록 표시
  - 카테고리별 이모지 아이콘
  - 목록 클릭 시 지도 이동 및 인포윈도우 자동 표시
- 전체 음식점 통합 검색 (한식+중식+일식+양식+분식+카페)
- 반응형 디자인 (PC/모바일)
- 성능 최적화
  - 인포윈도우 재사용
  - 메모리 누수 방지
  - 중복 장소 자동 제거

## 저장소 구조

```
├── index.html          # 메인 페이지 (서비스 소개 및 카테고리 선택)
├── map.js              # Kakao 지도 초기화 및 검색 로직
├── style.css           # 공통 스타일 파일(TODO)
│
├── food.html           # 전체 음식점 (통합 검색)
├── food-korean.html    # 한식 카테고리
├── food-chinese.html   # 중식 카테고리
├── food-japanese.html  # 일식 카테고리
├── food-western.html   # 양식 카테고리
├── food-snack.html     # 분식 카테고리
├── convenience.html    # 편의점 카테고리
├── pharmacy.html       # 약국 카테고리
├── hospital.html       # 병원 카테고리
│
└── (팀원 2 담당)
    ├── about.html          # 서비스 소개 페이지(TODO)
    ├── guide.html          # 이용 가이드(TODO)
    ├── search.html         # 검색 결과(TODO)
    ├── cafe.html           # 카페(TODO)
    ├── bank.html           # 은행/ATM(TODO)
    ├── stationery.html     # 문구점(TODO)
    ├── salon.html          # 미용실(TODO)
    ├── pcroom.html         # PC방(TODO)
    ├── gym.html            # 헬스장(TODO)
    └── karaoke.html        # 노래방(TODO)
```

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **API**: Kakao Maps JavaScript SDK
- **서버**: Nginx (정적 파일 서빙)
- **배포**: Oracle Cloud (Ubuntu 22.04)

## 구현 상세

### 1. 지도 초기화
```javascript
// 전주대학교 중심 좌표로 지도 생성
const map = initializeMap();
```

### 2. 장소 검색
```javascript
// Places API 키워드 검색
searchPlacesByKeyword("한식", map, callback);

// 전체 음식점은 여러 카테고리 통합 검색
searchMultipleKeywords(["한식", "중식", "일식", ...], map, callback);
```

### 3. 마커 표시 및 인포윈도우
- 검색 결과를 지도에 마커로 표시
- 마커 클릭 시 장소 상세 정보 팝업
- 인포윈도우 재사용으로 메모리 최적화

### 4. 사이드바 목록
- 왼쪽에 검색 결과 목록 표시
- 각 항목 클릭 시 지도 이동 및 인포윈도우 표시
- 카테고리별 이모지 아이콘 자동 표시

## 서버 환경 (Oracle Cloud)

* **OS**: Ubuntu 22.04 LTS
* **웹 서버**: Nginx 1.18
* **프로젝트 경로**: `/home/ubuntu/jju-compass-map`
* **도메인**: http://jju-map.duckdns.org
* **공개 IP**: 134.185.117.30

### Nginx 설정
```nginx
server {
    listen 80;
    server_name jju-map.duckdns.org 134.185.117.30;

    root /home/ubuntu/jju-compass-map;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```
