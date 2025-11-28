# jju-compass-map

전주대학교 주변 시설 정보를 카카오맵 기반으로 제공하는 정적 웹 서비스입니다.

## 🌐 배포 정보

**배포 URL**: https://jju-map.duckdns.org  
**서버**: Oracle Cloud (Ubuntu 22.04)  
**HTTPS**: Let's Encrypt SSL 인증서 적용

---

## 프로젝트 개요

* **목적**: 전주대학교 주변 음식점(한식, 중식, 일식, 양식, 분식), 편의점, 약국, 병원 등을 카카오맵을 통해 빠르게 탐색
* **구성**: HTML/CSS/JavaScript 기반의 정적 페이지, Kakao Maps JavaScript SDK 연동
* **팀 구성**: 2인 (9개 카테고리 구현 완료)

---

## 주요 기능

### ✅ 구현 완료
- **카카오맵 SDK 연동** 및 지도 초기화
- **Places API 검색** (2km 반경, 페이지네이션 지원)
  - 키워드 기반 장소 검색
  - 최대 45개 결과 자동 수집 (3페이지)
- **마커 시스템**
  - 검색 결과 마커 자동 생성
  - 자동 bounds 조정 (모든 마커가 보이도록)
  - 클릭 시 상세 정보 인포윈도우 표시
- **사이드바 목록**
  - 검색 결과 목록 표시
  - 카테고리별 이모지 아이콘
  - 목록 클릭 시 지도 이동 및 줌인
- **전체 음식점 통합 검색** (한식+중식+일식+양식+분식+카페)
- **반응형 디자인** (PC/모바일 최적화)
  - 모바일: 사이드바 40vh, 지도 60vh
- **성능 최적화**
  - 인포윈도우 재사용
  - 메모리 누수 방지
  - 중복 장소 자동 제거
  - CSS 통합 관리 (style.css)

---

## 저장소 구조

```
├── index.html          # 메인 페이지 (서비스 소개 및 카테고리 선택)
├── map.js              # Kakao 지도 초기화 및 검색 로직 (공통)
├── style.css           # 공통 스타일 시트
│
├── food.html           # 전체 음식점 (6개 카테고리 통합 검색)
├── food-korean.html    # 한식 카테고리
├── food-chinese.html   # 중식 카테고리
├── food-japanese.html  # 일식 카테고리
├── food-western.html   # 양식 카테고리
├── food-snack.html     # 분식 카테고리
├── convenience.html    # 편의점 카테고리
├── pharmacy.html       # 약국 카테고리
├── hospital.html       # 병원 카테고리
│
└── (팀원 2 담당 - TODO)
    ├── about.html          # 서비스 소개 페이지
    ├── guide.html          # 이용 가이드
    ├── search.html         # 검색 결과
    ├── cafe.html           # 카페
    ├── bank.html           # 은행/ATM
    ├── stationery.html     # 문구점
    ├── salon.html          # 미용실
    ├── pcroom.html         # PC방
    ├── gym.html            # 헬스장
    └── karaoke.html        # 노래방
```

---

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **API**: Kakao Maps JavaScript SDK v2
  - Maps API: 지도 표시
  - Places API: 장소 검색
- **웹 서버**: Nginx 1.18.0
- **배포 환경**: Oracle Cloud Infrastructure (Ubuntu 22.04 LTS)
- **도메인**: DuckDNS (무료 동적 DNS)
- **보안**: Let's Encrypt SSL/TLS 인증서

---

## 구현 상세

### 1. 지도 초기화
```javascript
// 전주대학교 공학1관 중심 좌표 (35.8144, 127.0924)
const map = initializeMap();
```

### 2. 장소 검색
```javascript
// 단일 키워드 검색 (2km 반경, 최대 45개)
searchPlacesByKeyword("한식", map, callback);

// 다중 키워드 통합 검색 (중복 제거)
searchMultipleKeywords(["한식", "중식", "일식", "양식", "분식", "카페"], map, callback);
```

### 3. 마커 표시
- `displayMarkers()`: 검색 결과를 마커로 변환
- `LatLngBounds`: 모든 마커가 보이도록 자동 조정
- `InfoWindow`: 단일 인스턴스 재사용 (메모리 효율)

### 4. 사이드바 목록
- `displayPlacesList()`: 검색 결과를 HTML 목록으로 렌더링
- `getCategoryEmoji()`: 카테고리별 이모지 매핑
- 클릭 이벤트: 지도 이동 + 줌인 + 인포윈도우 표시

---

## 최근 업데이트

### v1.2.0 (2025-11-07)
- ✅ **코드 중복 제거**: 9개 HTML 파일의 CSS를 style.css로 통합 (740줄 절감)
- ✅ **성능 최적화**: 검색 반경 2km 확대, 페이지네이션 구현 (45개 결과)
- ✅ **디버깅 로그 제거**: 프로덕션 환경 최적화
- ✅ **에러 처리 개선**: ZERO_RESULT 케이스 처리

### v1.3.0 (2025-11-14)
- ✅ 도보 경로 애니메이션(직선 폴백) 추가
- ✅ 시작 지점 지정(내 위치 / 지도 클릭) UI 추가
- ✅ 마커 드롭/바운스/리플/경로 따라가기 애니메이션 추가
- ✅ Directions 프록시 서버 구조 설계(/api/walk) 및 캐시 로직 초안
- 🔄 Kakao Mobility 실제 경로 통합 준비(REST 키 .env, 프록시 배포)

---

## 🚶 실제 도보 길찾기 연동 (프록시 방식 권장)

실제 도로/보행로를 따르는 경로를 표시하려면 Kakao Mobility Directions REST API를 **클라이언트에서 직접 호출하지 말고** 서버 프록시를 통해 호출해야 합니다. 프론트는 경로 좌표만 받아 폴리라인과 애니메이션을 그립니다.

### 1) 서버 디렉터리 구조
```
server/
  ├── package.json
  ├── server.js         # /api/walk 프록시
  └── .env.example      # 환경변수 템플릿
```

### 2) .env 설정 (커밋 금지)
`server/.env` 작성:
```
KAKAO_MOBILITY_REST_KEY=발급받은_키
PORT=3001
HOST=0.0.0.0
KAKAO_DIRECTIONS_BASE_URL=https://apis-navi.kakaomobility.com
```

### 3) 설치 & 실행
```bash
cd server
npm install
npm run start  # 또는: npm run dev
```

### 4) 프런트 연결 (HTML 내 map.js 로드 전에)
```html
<script>
  window.JJU_DIRECTIONS_API = 'https://jju-map.duckdns.org/api/walk';
</script>
<script src="map.js"></script>
```

### 5) 프록시 동작 흐름
1. 프런트: `/api/walk?origin=lng,lat&destination=lng,lat&mode=WALK`
2. 서버: Kakao REST 호출(Authorization: KakaoAK {REST_KEY})
3. 응답 파싱: `routes[0].sections[*].roads[*].vertexes` → `{lat,lng}` 배열
4. 반환 JSON:
```json
{
  "source": "live",
  "path": [{"lat":35.8144,"lng":127.0923}, ...],
  "distance": 1234,
  "duration": 980,
  "guides": [{"text":"10m 직진 후 좌회전","lat":...,"lng":...}]
}
```
5. 실패/쿼터 초과 시: 직선 경로 폴백(`source: fallback-error`)

### 6) 캐시
- 동일 `(origin|destination|mode|priority)` 키로 1시간 메모리 캐시.
- 트래픽/쿼터 절약 & 응답 속도 향상.
- 필요 시 Redis로 교체 가능.

### 7) 클라이언트 폴백 로직
`map.js`의 `showWalkingRoute` 에서 프록시 실패/미설정 시 직선 보간 경로로 애니메이션 처리 → 사용자 경험 유지.

### 8) 보안 수칙
- REST 키는 `.env`에만 저장.
- `server/.env`는 `.gitignore` 등록됨.
- 필요 시 CORS 화이트리스트(`origin: [...]`)로 제한.
- 호출량 모니터링: 서버 로그 + (추후) 경고 임계치 설정.

### 9) 확장 아이디어
- 턴 안내(guides) 마커/오버레이 표시
- 거리/예상 도보 시간 UI 배지
- 인기 목적지 경로 사전 캐시(프리워밍)
- 실패율/평균 응답 시간 메트릭 대시보드

### 10) 기타 대안 (요약)
| 분류 | 장점 | 단점 |
|------|------|------|
| Kakao REST + 프록시 | 지역 최적, 정확도 우수 | 쿼터 관리 필요 |
| OSRM/GraphHopper 자체호스팅 | 비용 절감, 커스터마이즈 | 초기 구축/업데이트 부담 |
| 사전 계산(정적 테이블) | 즉시 응답, API 0회 | 임의 시작점 처리 어려움 |

---

### v1.1.0 (2025-11-06)
- ✅ 모바일 반응형 디자인 개선 (40vh/60vh 분할)
- ✅ 마커 렌더링 이슈 해결 (setBounds + padding)
- ✅ HTTPS 적용 (Let's Encrypt SSL)

### v1.0.0 (2025-11-05)
- ✅ 카카오맵 API 연동 및 9개 카테고리 페이지 구현
- ✅ 마커, 인포윈도우, 사이드바 기능 완성
- ✅ DuckDNS 도메인 설정 및 Nginx 배포

---

## 서버 환경 (Oracle Cloud)

### 시스템 정보
- **OS**: Ubuntu 22.04 LTS
- **웹 서버**: Nginx 1.18.0
- **프로젝트 경로**: `/home/ubuntu/jju-compass-map`
- **도메인**: https://jju-map.duckdns.org
- **공개 IP**: 134.185.117.30
- **SSL 인증서**: Let's Encrypt (만료일: 2026-02-04, 자동 갱신)

### Nginx 설정
```nginx
# HTTP를 HTTPS로 리다이렉트
server {
    listen 80;
    server_name jju-map.duckdns.org 134.185.117.30;
    return 301 https://$server_name$request_uri;
}

# HTTPS 설정
server {
    listen 443 ssl http2;
    server_name jju-map.duckdns.org 134.185.117.30;

    ssl_certificate /etc/letsencrypt/live/jju-map.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jju-map.duckdns.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /home/ubuntu/jju-compass-map;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 방화벽 설정
```bash
# Oracle Cloud Security List
- Ingress: 0.0.0.0/0, TCP, Port 80, 443

# UFW (Ubuntu Firewall)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 로컬 개발 환경 설정

### 1. 프로젝트 클론
```bash
git clone https://github.com/jju-compass/jju-compass-map.git
cd jju-compass-map
```

### 2. 로컬 서버 실행
```bash
# Python 3
python3 -m http.server 5500

# Node.js (http-server)
npx http-server -p 5500

# VS Code Live Server 확장 사용
# index.html에서 우클릭 → "Open with Live Server"
```

### 3. 브라우저 접속
```
http://localhost:5500
```

### 4. 카카오 개발자 설정
- Kakao Developers 콘솔에서 `localhost:5500` 도메인 등록 필요
- 현재 API 키는 `jju-map.duckdns.org`와 `localhost:5500`에 등록됨

---

## API 사용량 및 제한

### Kakao Maps API
- **무료 할당량**: 일 300,000건
- **현재 사용량**: 일 평균 ~500건 (충분)
- **제한 사항**: 
  - 검색 반경: 최대 20km
  - 페이지당 결과: 15개
  - 최대 페이지: 3페이지 (총 45개)

---

## 성능 지표

### 페이지 로드 속도
- **초기 로드**: ~1.2초
- **지도 렌더링**: ~0.8초
- **검색 응답**: ~0.3초

### 파일 크기
- **HTML**: ~3KB/파일 (9개)
- **CSS**: 8KB (통합)
- **JS**: 12KB (map.js)
- **총 크기**: ~50KB (압축 전)

---

## 브라우저 지원

| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome | 90+ ✅ |
| Firefox | 88+ ✅ |
| Safari | 14+ ✅ |
| Edge | 90+ ✅ |
| Mobile Safari | iOS 14+ ✅ |
| Chrome Mobile | Android 5+ ✅ |

---

## 기여 가이드

### 팀원 역할
- **팀원 1**: 음식점 카테고리 9개 (완료)
- **팀원 2**: 기타 시설 카테고리 10개 (진행 중)

### 코드 스타일
```javascript
// 함수명: camelCase
function searchPlacesByKeyword() { }

// 상수: UPPER_SNAKE_CASE
const MAX_RESULTS = 45;

// 들여쓰기: 4 spaces
// 따옴표: 작은따옴표 (')
```

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
docs: 문서 수정
style: 스타일 변경
perf: 성능 개선
```

---

## 문제 해결

### 마커가 표시되지 않을 때
1. 브라우저 하드 리프레시: `Ctrl + Shift + R`
2. 콘솔 에러 확인: F12 → Console 탭
3. API 키 확인: Kakao Developers 콘솔

### 검색 결과가 없을 때
- 검색 반경 확인 (현재 2km)
- 키워드 정확도 확인
- 카카오맵에서 직접 검색하여 존재 여부 확인

### 모바일에서 지도가 안 보일 때
- 하드 리프레시 시도
- 4G/5G/WiFi 연결 확인
- HTTPS 접속 확인

---

## 라이선스

MIT License - 자유롭게 사용 가능

---

## 연락처

- **GitHub**: https://github.com/jju-compass/jju-compass-map
- **Issues**: https://github.com/jju-compass/jju-compass-map/issues

---

## 감사의 말

- **Kakao Maps API**: 지도 및 장소 검색 API 제공
- **DuckDNS**: 무료 동적 DNS 서비스
- **Let's Encrypt**: 무료 SSL 인증서
- **Oracle Cloud**: 무료 클라우드 인프라
