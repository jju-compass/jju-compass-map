# JJU Compass Map

전주대학교 주변 시설 검색 서비스 (카카오맵 기반)

**Live:** https://jju-map.duckdns.org

---

## 주요 기능

- 장소 검색 (Kakao Maps API)
- 즐겨찾기 관리
- 검색 히스토리 / 인기 검색어
- 도보 경로 안내 (Kakao Mobility API)
- 현재 위치 기반 검색
- 홈 위치 설정

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Webpack 5, Zustand |
| Backend | Go 1.18+, Gin, SQLite (pure Go driver) |
| API | Kakao Maps SDK, Kakao Mobility API |
| Infra | Oracle Cloud (ARM64), Nginx, Let's Encrypt |

---

## 프로젝트 구조

```
jju-compass-map/
├── frontend/                    # React + TypeScript + Webpack
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Button, Input, Loading, Icon
│   │   │   ├── Map/             # KakaoMap, MapMarker, MapControls
│   │   │   ├── Sidebar/         # SearchBar, PlaceItem, SearchResults, Sidebar
│   │   │   ├── panels/          # PlaceDetail, FavoritesPanel, HistoryPanel
│   │   │   └── directions/      # DirectionsPanel, RouteInfo, RoutePolyline
│   │   ├── hooks/               # useSearch, useFavorites, useGeolocation
│   │   ├── store/               # mapStore, userStore (Zustand)
│   │   ├── api/                 # API 클라이언트
│   │   ├── types/               # TypeScript 타입, kakao.d.ts
│   │   └── styles/              # global.css
│   ├── public/                  # index.html, favicon
│   └── package.json
│
├── backend/                     # Go + Gin
│   ├── cmd/server/              # main.go 엔트리포인트
│   └── internal/
│       ├── config/              # 환경 설정
│       ├── database/            # SQLite 연결
│       ├── models/              # 데이터 모델
│       ├── repository/          # DB CRUD (cache, favorite, history, settings)
│       ├── handler/             # API 핸들러 + 라우터
│       └── middleware/          # CORS, Rate Limit
│
├── database/                    # SQLite DB 파일
├── .env.example                 # 환경 변수 예시
└── README.md
```

---

## 개발 환경 설정

### 1. 환경 변수

```bash
cp .env.example .env
# KAKAO_API_KEY 설정
```

### 2. 프론트엔드

```bash
cd frontend
cp .env.example .env
# .env 파일에서 KAKAO_API_KEY 설정
npm install
npm run dev     # 개발 서버 (localhost:3000)
npm run build   # 프로덕션 빌드
```

### 3. 백엔드

```bash
cd backend
go mod download
go run ./cmd/server   # 개발 서버 (localhost:8080)
```

---

## 라이선스

MIT License
