# jju-compass-map
전주대학교 주변 시설 정보를 지도 형태로 제공하기 위한 정적 웹 프로젝트입니다.  
현재 저장소는 향후 구현을 위한 뼈대만 남겨 두었으며, 프로젝트 구조와 배포 환경을 이해하기 쉽게 문서화했습니다.

## 프로젝트 개요
- **목적**: 음식점, 카페, 편의시설 등 전주대 주변 시설을 카카오맵을 통해 빠르게 탐색할 수 있는 웹 서비스 구축
- **구성**: HTML/CSS/JavaScript 기반의 정적 페이지. Kakao Maps JavaScript SDK 연동을 전제로 합니다.
- **상태**: 메인 페이지(`index.html`)는 안내 문구만 포함하고 있으며, 기타 페이지와 자산은 `TODO` 주석으로만 구성된 플레이스홀더입니다.

## 저장소 구조
```
├── index.html          # 메인 페이지(설명 문구만 존재)
├── about.html          # 서비스 소개 페이지(추후 구현 예정, TODO 주석만 존재)
├── guide.html          # 이용 가이드 페이지(추후 구현 예정)
├── search.html         # 검색 결과 페이지(추후 구현 예정)
├── food*.html          # 음식점 관련 카테고리 페이지 6종(추후 구현 예정)
├── cafe.html           # 카페 카테고리 페이지(추후 구현 예정)
├── convenience.html    # 편의점 카테고리 페이지(추후 구현 예정)
├── pharmacy.html       # 약국 카테고리 페이지(추후 구현 예정)
├── hospital.html       # 병원 카테고리 페이지(추후 구현 예정)
├── bank.html           # 은행/ATM 페이지(추후 구현 예정)
├── stationery.html     # 문구점 페이지(추후 구현 예정)
├── salon.html          # 미용실 페이지(추후 구현 예정)
├── pcroom.html         # PC방 페이지(추후 구현 예정)
├── gym.html            # 헬스장 페이지(추후 구현 예정)
├── karaoke.html        # 노래방 페이지(추후 구현 예정)
├── style.css           # 공통 스타일 파일(현재는 TODO 주석만 존재)
├── map.js              # Kakao 지도 초기화 스크립트(현재는 TODO 주석만 존재)
└── README.md           # 프로젝트 설명 문서(본 문서)
```

## 로컬 개발 방법
1. 저장소를 클론합니다.
   ```bash
   git clone git@github.com:jju-compass/jju-compass-map.git
   cd jju-compass-map
   ```
2. 정적 사이트이므로 브라우저에서 `index.html`을 직접 열어 현재 상태를 확인할 수 있습니다.
3. Kakao Maps SDK를 적용할 때는 각 HTML 파일에 아래 스크립트를 추가합니다.
   ```html
   <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY"></script>
   <script src="map.js"></script>
   ```
4. `map.js`에 지도 초기화, 마커 생성, 카테고리 필터링 로직을 추가하고 카테고리별 HTML 파일에 지도 컨테이너 및 리스트 UI를 설계합니다.

## 배포 파이프라인
- **형상 관리**: Git ↔ GitHub (`main` 브랜치 사용)
- **배포 흐름**: 로컬 변경 → GitHub 푸시 → Oracle Cloud 서버에서 `git pull` → Nginx가 정적 파일을 제공
- **필요 명령 요약**
  ```bash
  # 로컬
  git add .
  git commit -m "message"
  git push

  # 서버(Oracle Cloud Ubuntu)
  ssh ubuntu@134.185.117.30
  cd ~/jju-compass-map
  git pull
  ```

## 서버 환경(Oracle Cloud)
- **OS**: Ubuntu 22.04 LTS
- **웹 서버**: Nginx 1.18
- **프로젝트 경로**: `/home/ubuntu/jju-compass-map`
- **Nginx 가상호스트 설정**: `/etc/nginx/sites-available/jju-compass`
  ```nginx
  server {
      listen 80;
      server_name 134.185.117.30;

      root /home/ubuntu/jju-compass-map;
      index index.html;

      location / {
          try_files $uri $uri/ =404;
      }
  }
  ```
- **활성화 방법**
  ```bash
  sudo ln -s /etc/nginx/sites-available/jju-compass /etc/nginx/sites-enabled/
  sudo unlink /etc/nginx/sites-enabled/default   # 기본 사이트 비활성화
  sudo nginx -t
  sudo systemctl reload nginx
  ```
- **퍼미션**: Nginx가 정적 파일에 접근할 수 있도록 `/home/ubuntu`는 최소 755 권한을 유지하고, 프로젝트는 `ubuntu:www-data` 소유로 설정합니다.
  ```bash
  sudo chmod 755 /home/ubuntu
  sudo chown -R ubuntu:www-data /home/ubuntu/jju-compass-map
  ```
- **방화벽**: nftables를 사용하며 80/443 포트를 허용한 상태입니다.
  ```bash
  sudo nft insert rule ip filter INPUT tcp dport '{80,443}' ct state new accept
  ```
  Oracle Cloud 보안 목록(VCN)에서도 동일한 포트가 인바운드로 열려 있어야 합니다.

## 유지 보수 메모
- 정적 파일만 변경될 경우 Nginx 재시작 없이 즉시 반영됩니다.
- Nginx 설정을 수정한 경우 `sudo systemctl reload nginx`로 설정을 다시 불러옵니다.
- 문제가 발생하면 `/var/log/nginx/error.log`와 `access.log`를 확인합니다.

## 향후 참고 사항
- Kakao Developers 콘솔에서 JavaScript 키를 발급받고 실제 서비스 도메인(예: `http://134.185.117.30`)을 허용 목록에 등록해야 지도 API가 동작합니다.
- 시설 데이터는 JSON 또는 JS 모듈 형태로 별도 디렉터리에 정리한 뒤 `map.js`에서 불러오는 방식을 권장합니다.
- README는 프로젝트 진행 상황에 맞춰 지속적으로 갱신해 주세요.

이 문서를 통해 새로운 기여자나 다른 AI 에이전트도 저장소 구조와 배포 환경을 빠르게 파악할 수 있습니다. 추가 사항은 자유롭게 보완해 주십시오.
