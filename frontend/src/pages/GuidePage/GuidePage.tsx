import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar, LandingFooter } from '../../components/landing';
import './GuidePage.css';

const guideSteps = [
  {
    number: 1,
    title: '카테고리 선택하기',
    description:
      '메인 페이지에서 원하는 카테고리 카드를 클릭하세요. 음식점, 카페, 편의점, 약국, 병원, 은행/ATM, 문구점, 미용실, 헬스장 등을 선택할 수 있습니다.',
  },
  {
    number: 2,
    title: '검색 바 사용하기',
    description:
      '지도 페이지 상단의 검색 바에 원하는 장소나 키워드를 입력하세요. 예: "한식", "카페", "편의점" 등을 검색하면 해당 장소들이 지도에 표시됩니다.',
  },
  {
    number: 3,
    title: '지도에서 장소 확인하기',
    description:
      '왼쪽 사이드바에서 카테고리를 선택하면 지도에 마커가 표시됩니다. 마커를 클릭하거나 오른쪽 목록에서 장소를 선택하면 상세 정보를 확인할 수 있습니다.',
  },
  {
    number: 4,
    title: '도보 경로 확인하기',
    description:
      '"길찾기" 버튼을 클릭하세요. "내 위치 사용" 또는 "지도에서 선택"으로 출발지를 설정한 후, 목적지 마커를 클릭하면 도보 경로가 애니메이션으로 표시됩니다.',
  },
  {
    number: 5,
    title: '모바일에서 사용하기',
    description:
      '모바일 브라우저에서도 동일하게 사용 가능합니다. 화면이 자동으로 세로 배치로 최적화되어 표시됩니다.',
  },
  {
    number: 6,
    title: '즐겨찾기 기능',
    description:
      '자주 방문하는 장소를 즐겨찾기에 추가하세요. 별 아이콘을 클릭하면 즐겨찾기에 저장되어 빠르게 접근할 수 있습니다.',
  },
];

const tips = [
  { label: '빠른 이동', description: '목록에서 장소를 클릭하면 지도가 해당 위치로 자동 이동합니다.' },
  { label: '상세 정보', description: '마커를 클릭하면 전화번호, 주소, 카카오맵 상세보기 링크를 확인할 수 있습니다.' },
  { label: '경로 초기화', description: '"경로 지우기" 버튼으로 표시된 경로를 제거할 수 있습니다.' },
  { label: '키보드 사용', description: 'Tab 키로 버튼과 링크를 이동하고 Enter로 선택할 수 있습니다.' },
];

const GuidePage: React.FC = () => {
  return (
    <div className="guide-page">
      {/* 스킵 내비게이션 */}
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>

      {/* 상단 네비게이션 */}
      <LandingNavbar />

      {/* 메인 콘텐츠 */}
      <main id="main-content" className="guide-main">
        {/* 헤더 섹션 */}
        <section className="guide-header">
          <h1>이용 가이드</h1>
          <p>전주대 주변 탐색지도 사용 방법을 안내합니다</p>
        </section>

        {/* 사용 방법 */}
        <section className="guide-section" aria-labelledby="guide-title">
          <h2 id="guide-title">사용 방법</h2>
          <div className="guide-steps">
            {guideSteps.map((step) => (
              <article key={step.number} className="guide-step">
                <div className="guide-step-number">{step.number}</div>
                <div className="guide-step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 유용한 팁 */}
        <section className="guide-section" aria-labelledby="tips-title">
          <h2 id="tips-title">유용한 팁</h2>
          <div className="guide-tips-card">
            <ul className="guide-tips-list">
              {tips.map((tip, index) => (
                <li key={index}>
                  <strong>{tip.label}:</strong> {tip.description}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="guide-cta">
          <Link to="/map" className="guide-cta-btn">
            지금 바로 사용해보기
          </Link>
        </section>
      </main>

      {/* 푸터 */}
      <LandingFooter />
    </div>
  );
};

export default GuidePage;
