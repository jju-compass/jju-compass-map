# jju-compass-map
전주대학교 주변 시설을 탐색하기 위한 정적 웹 서비스입니다.  
현재는 메인 페이지 초안과 각 카테고리 페이지의 빈 껍데기만 남겨 둔 상태로, 본격 구현 전에 구조를 간소화한 단계입니다.

## 1. 현재 상태
- `index.html`: 간단한 소개 문구만 포함한 메인 페이지
- 그 외 HTML 파일: `<!-- TODO -->` 주석만 포함된 빈 페이지
- `style.css`, `map.js`: 추후 구현을 위한 주석만 남김
- 서버·배포 설정은 그대로 유지(Nginx로 정적 파일 서빙)

## 2. 앞으로의 작업 범위
| 담당 | 파일 | 예정 작업 |
| --- | --- | --- |
| 조성규 | `index.html` 외 음식점/편의 시설 HTML | 카카오맵 초기화, 카테고리별 마커·인포윈도우 로직 구현 |
|  | `map.js` | 공통 지도 함수 작성, 데이터 연동 |
|  | 데이터 파일 | 시설 정보 수집 및 구조화(JSON/JS) |

## 3. 개발 환경
- 언어: HTML5, CSS3, Vanilla JavaScript
- 지도: Kakao Maps JavaScript SDK (키 발급 및 도메인 등록 필요)
- 배포: GitHub → Oracle Cloud Ubuntu 서버 → Nginx

## 4. 서버 메모
- 프로젝트 경로: `/home/ubuntu/jju-compass-map`
- Nginx 설정: `/etc/nginx/sites-available/jju-compass` (루트는 위 경로)
- 방화벽: nftables로 80/443 허용, Oracle VCN 인바운드도 개방

## 5. 배포 플로우
1. 로컬에서 수정 → GitHub `main`에 push
2. 서버 접속 후 `git pull`
3. 정적 파일이므로 별도 재시작 없이 즉시 반영 (설정 변경 시 `sudo systemctl reload nginx`)

## 6. 다음 단계 체크리스트
- Kakao Developers에서 JavaScript 키 발급 후 도메인 추가
- `index.html`에 지도 스크립트 삽입 및 `map.js`에 초기화 코드 작성
- 카테고리별 HTML 파일에 지도 컨테이너/리스트 구조 추가
- 시설 데이터 수집 및 JSON 구조 설계

필요한 작업을 수행하면서 README를 계속 업데이트해 주세요. 이렇게 하면 프로젝트의 최신 범위와 진행 상황을 다른 팀원이나 도구가 즉시 이해할 수 있습니다.
