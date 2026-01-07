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
| Backend | Go 1.21+, Gin, SQLite (pure Go driver) |
| API | Kakao Maps SDK, Kakao Mobility API |
| Infra | Oracle Cloud (ARM64), Nginx, systemd, Let's Encrypt |

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
│   ├── dist/                    # 빌드 결과물 (gitignore)
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

## 배포

### 빌드

```bash
# 프론트엔드 (.env 파일 필요)
cd frontend
echo "KAKAO_API_KEY=your_key" > .env
npm install
npm run build

# 백엔드 (ARM64)
cd backend && GOOS=linux GOARCH=arm64 go build -o jju-server ./cmd/server
```

### 서버 배포

```bash
# SSH 접속
ssh ubuntu@jju-map.duckdns.org

# 코드 업데이트
cd /var/www/jju-compass-map
git pull

# 프론트엔드 빌드 (.env 파일 설정 필요)
cd frontend
# .env 파일이 없으면 생성: echo "KAKAO_API_KEY=your_key" > .env
npm install
npm run build

# 백엔드 재시작 (API 변경 시)
cd ../backend
go build -o jju-server ./cmd/server
sudo systemctl restart jju-server
```

---

## API 엔드포인트

Base URL: `https://jju-map.duckdns.org/api`

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 헬스 체크 |
| **Cache** |
| GET | `/cache/search?keyword=` | 캐시된 검색 결과 조회 |
| POST | `/cache/search` | 검색 결과 캐시 저장 |
| DELETE | `/cache/search?keyword=` | 캐시 삭제 |
| **Favorites** |
| GET | `/favorites` | 즐겨찾기 목록 |
| POST | `/favorites` | 즐겨찾기 추가 |
| DELETE | `/favorites/:placeId` | 즐겨찾기 제거 |
| **History** |
| GET | `/history` | 검색 히스토리 |
| GET | `/history/popular` | 인기 검색어 |
| DELETE | `/history` | 히스토리 전체 삭제 |
| DELETE | `/history/:id` | 히스토리 개별 삭제 |
| **Settings** |
| GET | `/settings/home` | 홈 위치 조회 |
| POST | `/settings/home` | 홈 위치 저장 |
| DELETE | `/settings/home` | 홈 위치 삭제 |
| **Directions** |
| GET | `/directions?origin=x,y&destination=x,y` | 도보 경로 |

---

## 빌드 결과

```
Frontend: ~217KB (main.js 37KB + vendors.js 143KB + main.css 37KB)
Backend:  ~34MB (Go 바이너리, ARM64)
```

---

## 라이선스

MIT License
