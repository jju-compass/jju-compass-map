# JJU Compass Map

전주대학교 주변 시설 검색 서비스 (카카오맵 기반)

**Live:** https://jju-map.duckdns.org

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js, Express, SQLite |
| API | Kakao Maps SDK, Kakao Mobility API |
| Infra | Oracle Cloud, Nginx, PM2, Let's Encrypt |

---

## 서버 아키텍처

```
┌─────────────────────────────────────────┐
│            Oracle Cloud Ubuntu          │
├─────────────────────────────────────────┤
│  [Nginx :443]                           │
│      ├── /api/* → localhost:3000        │
│      └── /* → 정적 파일 서빙             │
│                                         │
│  [PM2]                                  │
│      └── jju-directions (port 3000)     │
└─────────────────────────────────────────┘
```

---

## 배포 명령어

| 변경 대상 | 명령어 |
|-----------|--------|
| 정적 파일 (HTML/CSS/JS) | `git pull` |
| API 서버 (server/) | `git pull && pm2 restart jju-directions` |

### PM2 관리

```bash
pm2 list                    # 프로세스 목록
pm2 logs jju-directions     # 로그 확인
pm2 monit                   # 실시간 모니터링
pm2 restart jju-directions  # 재시작
```

---

## REST API

Base URL: `https://jju-map.duckdns.org/api`

### 검색 캐시

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/cache/search?keyword=` | 캐시된 검색 결과 조회 |
| POST | `/cache/search` | 검색 결과 캐시 저장 |
| GET | `/cache/stats` | 캐시 통계 |
| DELETE | `/cache` | 캐시 정리 |

### 즐겨찾기

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/favorites` | 목록 조회 |
| POST | `/favorites` | 추가 |
| DELETE | `/favorites/:placeId` | 제거 |
| GET | `/favorites/check/:placeId` | 단건 확인 |
| POST | `/favorites/check` | 일괄 확인 |

### 검색 히스토리

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/history` | 검색 기록 |
| GET | `/history/popular` | 인기 검색어 |
| DELETE | `/history` | 기록 삭제 |

### 사용자 설정

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/settings/home` | 홈 위치 조회 |
| POST | `/settings/home` | 홈 위치 저장 |
| DELETE | `/settings/home` | 홈 위치 삭제 |

### 경로 찾기

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/directions?origin=lng,lat&destination=lng,lat` | 도보 경로 |

### Rate Limiting

| 대상 | 제한 |
|------|------|
| 일반 API | 100회/분 |
| 검색 API | 30회/분 |
| Directions | 5,000회/일 |

### 헤더

- `X-User-Id`: 사용자 식별 (선택)

---

## 프로젝트 구조

```
├── index.html          # 랜딩 페이지
├── map.html            # 메인 지도 (카카오맵)
├── map.js              # 지도 핵심 로직 (111KB, 3035줄)
├── config.js           # 카테고리, 색상 테마 (14KB)
├── style.css           # 통합 스타일 (86KB)
├── pathfinder.js       # A* 경로 탐색
├── roadNetwork.js      # 도로 네트워크 데이터
│
├── food-*.html         # 음식점 카테고리 페이지
├── cafe.html           # 카페
├── pharmacy.html       # 약국
├── ...                 # 기타 카테고리
│
├── about.html          # 서비스 소개
├── guide.html          # 이용 가이드
├── survey.html         # 설문조사
│
└── server/
    ├── server.js       # Express API 서버
    ├── database.js     # SQLite 관리
    └── .env.example    # 환경변수 템플릿
```

---

## 핵심 코드 (map.js)

### MapState 객체

```javascript
MapState = {
    markers: [],              // 활성 마커 배열
    clusterer: null,          // 마커 클러스터러
    infowindow: null,         // 싱글톤 인포윈도우
    transientOverlays: [],    // 임시 오버레이 (애니메이션)
    route: {
        startPosition: null,
        polyline: null,
        animMarker: null
    },
    home: {
        position: null,
        marker: null
    },
    favorites: new Set(),
    currentResults: [],
    currentSort: 'distance'
};
```

### 주요 함수

| 함수 | 라인 | 설명 |
|------|------|------|
| `initializeMap()` | 788 | 카카오맵 초기화 |
| `clearMarkers()` | 1029 | 마커 정리 (메모리 관리) |
| `initClusterer()` | 719 | 클러스터러 초기화 |
| `dropMarker()` | 860 | 마커 드롭 애니메이션 |
| `bounceMarker()` | 889 | 마커 바운스 효과 |

---

## 로컬 개발

### 프론트엔드

```bash
npx http-server -p 5500
# 또는
python3 -m http.server 5500
```

### 백엔드

```bash
cd server
cp .env.example .env  # API 키 설정
npm install
npm start
```

### Kakao API 설정

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 앱 생성 → JavaScript 키 발급
3. 플랫폼 등록: `http://localhost:5500`
4. `map.html`의 appkey 수정

---

## 주요 기능

- 16개 카테고리 검색 (음식점 6종 + 편의시설 10종)
- 2km 반경, 최대 45개 결과
- 마커 클러스터링 (15개 이상)
- 즐겨찾기 (서버 저장)
- 검색 히스토리 & 인기 검색어
- 도보 경로 안내 + 애니메이션
- 홈 위치 설정
- 반응형 (PC/모바일)

---

## 버전 히스토리

### v2.1.0 (2025-01)
- Directions API 일일 한도 (5000건)
- 설문조사 페이지
- 입력 검증 강화

### v2.0.0 (2024-12)
- SQLite + 즐겨찾기/히스토리
- 마커 클러스터링
- 홈 위치 설정
- Rate Limiting

---

## 라이선스

MIT License
