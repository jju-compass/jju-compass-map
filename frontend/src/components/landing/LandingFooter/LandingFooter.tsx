import React from 'react';
import './LandingFooter.css';

const LandingFooter: React.FC = () => {
  return (
    <footer className="landing-footer">
      <div className="footer-content">
        <div className="footer-logo">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>JJU Map</span>
        </div>
        <p>&copy; 2025 전주대 주변 탐색지도. All rights reserved.</p>
        <p>전주대학교 웹프로그래밍 팀 프로젝트</p>
      </div>
    </footer>
  );
};

export default LandingFooter;
