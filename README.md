# JJU Compass Map

전주대학교 주변 시설 검색 서비스 (카카오맵 기반)

**Live:** https://jju-map.duckdns.org

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Webpack, Zustand |
| Backend | Go 1.21+, Gin, SQLite |
| API | Kakao Maps SDK, Kakao Mobility API |
| Infra | Oracle Cloud (ARM64), Nginx, systemd, Let's Encrypt |

---

## 프로젝트 구조

```
jju-compass-map/
├── frontend/                # React + TypeScript + Webpack
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── store/           # Zustand 스토어
│   │   ├── api/             # API 클라이언트
│   │   ├── types/           # TypeScript 타입
│   │   ├── styles/          # CSS 스타일
│   │   └── pages/           # 페이지 컴포넌트
│   ├── public/              # 정적 파일
│   ├── dist/                # 빌드 결과물
│   └── package.json
│
├── backend/                 # Go + Gin
│   ├── cmd/server/          # 엔트리포인트
│   ├── internal/
│   │   ├── config/          # 설정
│   │   ├── handler/         # API 핸들러
│   │   ├── middleware/      # 미들웨어
│   │   ├── repository/      # DB 레이어
│   │   └── service/         # 비즈니스 로직
│   └── go.mod
│
└── database/                # SQLite DB
```

---

## 개발 환경 설정

### 프론트엔드

```bash
cd frontend
npm install
npm run dev     # 개발 서버 (localhost:3000)
npm run build   # 프로덕션 빌드
```

### 백엔드

```bash
cd backend
cp .env.example .env  # 환경변수 설정
go mod download
go run ./cmd/server   # 개발 서버 (localhost:8080)
```

---

## 배포

### 서버 빌드

```bash
# 프론트엔드
cd frontend && npm run build

# 백엔드 (ARM64용)
cd backend && GOOS=linux GOARCH=arm64 go build -o jju-server ./cmd/server
```

### 서버 배포

```bash
# 정적 파일만 변경 시
git pull

# API 변경 시
git pull && sudo systemctl restart jju-server
```

---

## API 엔드포인트

Base URL: `https://jju-map.duckdns.org/api`

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/cache/search?keyword=` | 캐시된 검색 결과 |
| POST | `/cache/search` | 검색 결과 캐시 저장 |
| GET | `/favorites` | 즐겨찾기 목록 |
| POST | `/favorites` | 즐겨찾기 추가 |
| DELETE | `/favorites/:placeId` | 즐겨찾기 제거 |
| GET | `/history` | 검색 히스토리 |
| GET | `/history/popular` | 인기 검색어 |
| GET | `/settings/home` | 홈 위치 조회 |
| POST | `/settings/home` | 홈 위치 저장 |
| GET | `/directions` | 도보 경로 |
| GET | `/health` | 헬스 체크 |

---

## 라이선스

MIT License
