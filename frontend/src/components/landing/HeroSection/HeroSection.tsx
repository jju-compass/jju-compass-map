import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-content">
        <div className="hero-badge">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <span>전주대학교 학생을 위한 지도 서비스</span>
        </div>
        <h1 id="hero-title" className="hero-title">
          전주대 주변 정보를
          <br />
          <span className="gradient-text">한눈에</span>
        </h1>
        <p className="hero-description">
          음식점, 카페, 편의점부터 병원, 약국까지
          <br />
          전주대학교 주변 모든 장소를 쉽게 찾아보세요
        </p>
        <div className="hero-buttons">
          <Link to="/map" className="btn btn-primary" aria-label="지도 페이지로 이동">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            지도 시작하기
          </Link>
          <div className="hero-links">
            <a href="#categories" className="hero-link">
              카테고리 보기
            </a>
            <span className="hero-link-divider">·</span>
            <Link to="/survey" className="hero-link">
              설문 참여하기
            </Link>
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <div className="floating-card card-1">
          <div className="card-icon">🍚</div>
          <div className="card-text">
            <div className="card-title">한식</div>
            <div className="card-desc">45개 장소</div>
          </div>
        </div>
        <div className="floating-card card-2">
          <div className="card-icon">☕</div>
          <div className="card-text">
            <div className="card-title">카페</div>
            <div className="card-desc">32개 장소</div>
          </div>
        </div>
        <div className="floating-card card-3">
          <div className="card-icon">💊</div>
          <div className="card-text">
            <div className="card-title">약국</div>
            <div className="card-desc">8개 장소</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
