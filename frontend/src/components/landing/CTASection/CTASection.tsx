import React from 'react';
import { Link } from 'react-router-dom';
import './CTASection.css';

const CTASection: React.FC = () => {
  return (
    <section className="cta">
      <div className="cta-content">
        <h2>지금 바로 시작하세요</h2>
        <p>전주대학교 주변의 모든 정보를 한눈에</p>
        <div className="cta-buttons">
          <Link to="/map" className="btn btn-large">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            지도 시작하기
          </Link>
          <Link to="/survey" className="btn btn-large btn-outline-light">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            설문 참여하기
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
