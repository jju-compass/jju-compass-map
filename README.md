# JJU Compass Map

전주대학교 주변 시설 정보를 카카오맵 기반으로 제공하는 웹 서비스입니다.

## 배포 정보

- **URL**: https://jju-map.duckdns.org
- **서버**: Oracle Cloud (Ubuntu 22.04) + Nginx
- **SSL**: Let's Encrypt 인증서 적용

---

## 주요 기능

### 지도 & 검색
- 카카오맵 SDK 연동 (2km 반경, 최대 45개 결과)
- 16개 카테고리 검색 (음식점 6종 + 편의시설 10종)
- 검색 결과 정렬 (거리순/이름순)
- 마커 클러스터링 (15개 이상 시 자동 그룹화)
- 홈 위치 설정 (검색 기준점 커스터마이징)

### 즐겨찾기 & 히스토리
- 장소 즐겨찾기 (서버 저장)
- 검색 히스토리 & 인기 검색어
- 검색 결과 서버 캐싱 (1시간 TTL)

### 경로 안내
- 도보 경로 표시 (Kakao Directions API)
- 경로 애니메이션 (발자국 트레일)
- 거리/예상 시간 표시

### UI/UX
- 반응형 디자인 (PC/모바일)
- 장소 상세 패널 (좌측 고정)
- 사운드 효과 (토글 가능)
- 키보드 접근성 지원

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| API | Kakao Maps SDK v2, Kakao Directions API |
| Backend | Node.js, Express, SQLite |
| 배포 | Oracle Cloud, Nginx, Let's Encrypt |

---

## 프로젝트 구조

```
├── index.html          # 랜딩 페이지
├── map.html            # 메인 지도 페이지 (통합)
├── map.js              # 지도 핵심 로직 (3000+ lines)
├── config.js           # 카테고리 정보, 색상 테마
├── style.css           # 통합 스타일시트
│
├── food.html           # 음식점 통합
├── food-*.html         # 음식점 카테고리 (한식/중식/일식/양식/분식)
├── cafe.html           # 카페
├── convenience.html    # 편의점
├── pharmacy.html       # 약국
├── hospital.html       # 병원
├── bank.html           # 은행/ATM
├── stationery.html     # 문구점
├── salon.html          # 미용실
├── pcroom.html         # PC방
├── gym.html            # 헬스장
├── karaoke.html        # 노래방
│
├── about.html          # 서비스 소개
├── guide.html          # 이용 가이드
├── search.html         # 검색 페이지
├── survey.html         # 설문조사
│
└── server/             # API 서버
    ├── server.js       # Express 서버 (v2.1)
    ├── database.js     # SQLite 데이터베이스
    └── .env.example    # 환경변수 템플릿
```

---

## 버전 히스토리

### v2.1.0 (2025-01)
- 일일 API 호출 한도 (5000건/일) - Kakao Directions API 비용 보호
- 설문조사 페이지 추가
- Directions API 보안 강화 (입력 검증)
- UX 개선: 결과 카드 리디자인, 인포윈도우 → 고정 패널
- 모바일 UI/애니메이션 개선
- 인기 검색어 버그 수정

### v2.0.0 (2025-12)
- SQLite 데이터베이스 연동
- 즐겨찾기 시스템 (서버 저장)
- 검색 히스토리 & 인기 검색어
- 홈 위치(검색 기준점) 설정
- 마커 클러스터링
- 검색 결과 정렬 (거리순/이름순)
- 장소 상세 패널 UI
- 사운드 효과 시스템
- 키보드 접근성 개선
- Rate Limiting (API 보호)
- config.js 분리 (카테고리/색상 테마)

### v1.3.0 (2025-11-14)
- 도보 경로 애니메이션 추가
- 시작 지점 지정 UI
- 마커 드롭/바운스/리플 애니메이션
- Directions 프록시 서버 구조 설계

### v1.2.0 (2025-11-07)
- CSS 통합 (style.css)
- 검색 반경 2km 확대
- 페이지네이션 (최대 45개 결과)

### v1.1.0 (2025-11-06)
- 모바일 반응형 디자인
- HTTPS 적용

### v1.0.0 (2025-11-05)
- 카카오맵 API 연동
- 9개 카테고리 구현
- Oracle Cloud 배포

---

## 라이선스

MIT License

---

## 링크

- **GitHub**: https://github.com/jju-compass/jju-compass-map
