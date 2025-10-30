# jju-compass-map
전주대 근처 시설(식당·카페·놀거리 등) 빠른 검색 지도 서비스

## 프로젝트 계획
- 팀명: 나침반
- 팀원: 조성규(5번), 김민주(10번)
- 기간: 2025.10.17 ~ 2025.11.30

### 제품 개요
- 제품 이름: 전주대 주변 탐색지도(JJU Map)
- 아이템 개요: 전주대학교 주변 음식점(한식, 중식, 일식 등), 약국, 편의점, 카페 등을 카카오맵 API로 빠르게 검색하고 지도에 표시하는 웹 서비스

### 문제 인식
- 신입생과 타지역 학생들이 전주대 주변 지리를 파악하기 어렵다.
- 급하게 약국이나 편의점을 찾을 때 시간이 많이 소요된다.
- 일반 지도 앱은 학교 특화 정보가 부족하다.

### 제품 장점
- 전주대 중심 특화 서비스로 카테고리 버튼을 통한 빠른 검색이 가능하다.
- 카카오맵 API 연동으로 실시간 정보를 제공한다.
- 모바일 반응형 웹으로 언제든 즉시 이용할 수 있다.

### 실현 가능성
- 카카오맵 JavaScript API는 무료로 사용 가능하다.
- HTML/CSS/JavaScript 기반으로 개발하며, 필요 시 서버 및 DB도 구축할 수 있다.
- 웹프로그래밍 수강 기간 내에 개발이 가능하다.

### 제품 전략
1. 기본 지도와 카테고리 검색 기능 구현
2. 사용자 리뷰 및 북마크 기능 추가
- 홍보: 전주대 에브리타임과 SNS 활용
- 확장: 장기적으로 광고 수익 확보 및 타 대학 확장

### 기본 페이지(4)
- `index.html`: 전체 지도 + 전체 카테고리 마커
- `about.html`: 서비스 소개
- `guide.html`: 이용 가이드
- `search.html`: 키워드 검색 결과 페이지

### 카테고리별 지도 페이지(16)
- `food.html`
- `food-korean.html`
- `food-chinese.html`
- `food-japanese.html`
- `food-western.html`
- `food-snack.html`
- `cafe.html`
- `convenience.html`
- `pharmacy.html`
- `hospital.html`
- `bank.html`
- `stationery.html`
- `salon.html`
- `pcroom.html`
- `gym.html`
- `karaoke.html`
