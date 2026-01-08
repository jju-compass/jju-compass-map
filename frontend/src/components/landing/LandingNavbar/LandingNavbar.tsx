import React from 'react';
import { Link } from 'react-router-dom';
import './LandingNavbar.css';

const LandingNavbar: React.FC = () => {
  return (
    <nav className="landing-navbar" aria-label="메인 네비게이션">
      <div className="landing-nav-content">
        <Link to="/" className="nav-logo">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>JJU Map</span>
        </Link>
        <div className="nav-links">
          <Link to="/about">소개</Link>
          <Link to="/guide">사용방법</Link>
          <Link to="/map" className="nav-btn-primary">
            지도 시작하기
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
