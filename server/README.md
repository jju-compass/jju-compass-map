# JJU Compass - Directions Proxy Server

카카오 Directions API를 호출하는 프록시 서버입니다.

## 설정 방법

### 1. 의존성 설치

```bash
cd server
npm install
```

### 2. 카카오 REST API 키 발급

1. [카카오 개발자 콘솔](https://developers.kakao.com) 접속
2. 내 애플리케이션 → 앱 선택 (또는 새로 생성)
3. 좌측 메뉴에서 **"앱 키"** 선택
4. **REST API 키** 복사

### 3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일을 열어서 REST API 키 입력:

```env
KAKAO_REST_API_KEY=your-kakao-rest-api-key-here
PORT=3000
```

### 4. 서버 실행

**일반 실행:**
```bash
npm start
```

**개발 모드 (자동 재시작):**
```bash
npm run dev
```

서버가 실행되면 다음과 같이 표시됩니다:
```
╔════════════════════════════════════════════╗
║   JJU Compass Directions Proxy Server     ║
╠════════════════════════════════════════════╣
║   포트: 3000                              ║
║   상태: 실행 중                            ║
║   API: /api/directions                     ║
║   캐시: /api/cache/stats                   ║
╚════════════════════════════════════════════╝
```

## API 엔드포인트

### 경로 찾기
```
GET /api/directions?origin=127.092,35.814&destination=127.095,35.816&priority=RECOMMEND
```

**파라미터:**
- `origin`: 출발지 좌표 (경도,위도)
- `destination`: 목적지 좌표 (경도,위도)
- `priority`: 경로 우선순위 (선택)
  - `RECOMMEND`: 추천 경로 (기본값)
  - `TIME`: 빠른 경로
  - `DISTANCE`: 짧은 경로

**응답 예시:**
```json
{
  "source": "kakao_directions",
  "path": [
    { "lng": 127.092, "lat": 35.814 },
    { "lng": 127.093, "lat": 35.815 },
    ...
  ],
  "distance": 1234,
  "duration": 180,
  "priority": "RECOMMEND",
  "cached": false
}
```

### 캐시 정보
```
GET /api/cache/stats
```

### 캐시 초기화
```
DELETE /api/cache
```

### 헬스체크
```
GET /health
```

## 테스트 방법

### 브라우저에서 테스트:
```
http://localhost:3000/api/directions?origin=127.092,35.814&destination=127.095,35.816
```

### curl로 테스트:
```bash
curl "http://localhost:3000/api/directions?origin=127.092,35.814&destination=127.095,35.816&priority=RECOMMEND"
```

## 프론트엔드 연동

`map.html`에서 프록시 서버 URL을 설정:

```html
<script>
  window.JJU_DIRECTIONS_API = 'http://localhost:3000/api/directions';
</script>
```

프로덕션 배포 시에는 실제 서버 URL로 변경:
```javascript
window.JJU_DIRECTIONS_API = 'https://your-server.com/api/directions';
```

## 주의사항

1. **API 키 보안**: `.env` 파일은 절대 Git에 커밋하지 마세요
2. **CORS 설정**: 프로덕션 배포 시 `server.js`의 CORS origin을 실제 도메인으로 변경하세요
3. **API 할당량**: 카카오 API는 무료 할당량 제한이 있습니다 (일일 약 300,000건)
4. **캐싱**: 동일한 경로는 1시간 동안 캐시되어 API 호출을 줄입니다

## 문제 해결

### API 키 오류
```
⚠️  경고: KAKAO_REST_API_KEY가 설정되지 않았습니다!
```
→ `.env` 파일에 `KAKAO_REST_API_KEY`를 설정했는지 확인

### CORS 오류
→ `server.js`의 CORS origin에 프론트엔드 URL이 포함되어 있는지 확인

### 경로를 찾을 수 없음
→ 좌표가 올바른지 확인 (경도, 위도 순서)
→ 카카오 API가 해당 지역을 지원하는지 확인

## 프로덕션 배포

### PM2로 실행 (권장)
```bash
npm install -g pm2
pm2 start server.js --name jju-proxy
pm2 save
pm2 startup
```

### Nginx 리버스 프록시 설정 예시
```nginx
location /api/directions {
    proxy_pass http://localhost:3000/api/directions;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```
