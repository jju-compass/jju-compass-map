import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNavbar, LandingFooter } from '../../components/landing';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-page">
      <LandingNavbar />

      <main className="not-found-main">
        <div className="not-found-content">
          <div className="not-found-icon">
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
              <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
            </svg>
          </div>
          <h1>404</h1>
          <h2>페이지를 찾을 수 없습니다</h2>
          <p>
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
            <br />
            주소를 확인해 주세요.
          </p>
          <div className="not-found-buttons">
            <Link to="/" className="not-found-btn primary">
              홈으로 돌아가기
            </Link>
            <Link to="/map" className="not-found-btn secondary">
              지도 보기
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default NotFoundPage;
