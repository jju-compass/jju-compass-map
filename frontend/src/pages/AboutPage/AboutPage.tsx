import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar, LandingFooter } from '../../components/landing';
import './AboutPage.css';

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: '카카오맵 기반',
    description: '정확한 위치 정보와 최신 데이터를 제공합니다',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: '다양한 카테고리',
    description: '음식점부터 편의시설까지 15개 이상의 카테고리',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
    title: '반응형 디자인',
    description: 'PC와 모바일 모두 최적화된 사용자 경험',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: '도보 경로 안내',
    description: '출발지에서 목적지까지 도보 경로 애니메이션',
  },
];

const techStack = [
  { label: 'Frontend', value: 'React, TypeScript, Zustand' },
  { label: 'Backend', value: 'Go, Gin Framework, SQLite' },
  { label: 'API', value: 'Kakao Maps JavaScript SDK v2' },
  { label: 'Deployment', value: 'Oracle Cloud, Nginx, Let\'s Encrypt SSL' },
];

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      {/* 스킵 내비게이션 */}
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>

      {/* 상단 네비게이션 */}
      <LandingNavbar />

      {/* 메인 콘텐츠 */}
      <main id="main-content" className="about-main">
        {/* 헤더 섹션 */}
        <section className="about-header">
          <h1>서비스 소개</h1>
          <p>전주대 주변 탐색지도에 대해 알아보세요</p>
        </section>

        {/* 프로젝트 소개 */}
        <section className="about-section" aria-labelledby="intro-title">
          <h2 id="intro-title">프로젝트 소개</h2>
          <div className="about-content-card">
            <p>
              전주대 주변 탐색지도는 전주대학교 학생들을 위한 지도 서비스입니다.
            </p>
            <p>
              카카오맵 API를 활용하여 주변 음식점, 카페, 편의시설 등을 쉽고 빠르게
              찾을 수 있습니다.
            </p>
          </div>
        </section>

        {/* 주요 기능 */}
        <section className="about-features" aria-label="주요 기능">
          <h2>주요 기능</h2>
          <div className="about-features-grid">
            {features.map((feature, index) => (
              <article key={index} className="about-feature-card">
                <div className="about-feature-icon" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 기술 스택 */}
        <section className="about-section" aria-labelledby="tech-title">
          <h2 id="tech-title">기술 스택</h2>
          <div className="about-content-card">
            <ul className="about-tech-list">
              {techStack.map((tech, index) => (
                <li key={index}>
                  <strong>{tech.label}:</strong> {tech.value}
                </li>
              ))}
              <li>
                <strong>Repository:</strong>{' '}
                <a
                  href="https://github.com/jju-compass/jju-compass-map"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* 개발팀 */}
        <section className="about-section" aria-labelledby="team-title">
          <h2 id="team-title">개발팀</h2>
          <div className="about-content-card">
            <p>전주대학교 웹프로그래밍 수업 팀 프로젝트로 개발되었습니다.</p>
            <p>학생들의 편의를 위해 지속적으로 개선하고 있습니다.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <Link to="/map" className="about-cta-btn">
            지도 시작하기
          </Link>
        </section>
      </main>

      {/* 푸터 */}
      <LandingFooter />
    </div>
  );
};

export default AboutPage;
