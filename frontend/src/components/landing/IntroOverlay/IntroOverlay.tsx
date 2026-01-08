import React, { useState, useEffect } from 'react';
import './IntroOverlay.css';

interface IntroOverlayProps {
  duration?: number; // 밀리초 단위
  onComplete?: () => void;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({
  duration = 2500,
  onComplete,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // 스크롤 방지
    document.body.style.overflow = 'hidden';

    // duration 후 페이드아웃 시작
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      document.body.style.overflow = '';
    }, duration);

    // 페이드아웃 애니메이션 완료 후 제거
    const hideTimer = setTimeout(() => {
      setIsHidden(true);
      onComplete?.();
    }, duration + 600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      document.body.style.overflow = '';
    };
  }, [duration, onComplete]);

  if (isHidden) return null;

  return (
    <div className={`intro-overlay ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="intro-content">
        <div className="intro-logo">
          <svg
            className="intro-pin"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div className="intro-pulse" />
        </div>
        <h1 className="intro-title">JJU Map</h1>
        <p className="intro-subtitle">전주대학교 주변을 탐색하세요</p>
        <div className="intro-features">
          <span className="intro-feature">맛집</span>
          <span className="intro-feature">카페</span>
          <span className="intro-feature">편의시설</span>
        </div>
        <div className="intro-loading">
          <div className="intro-loading-bar" />
        </div>
      </div>
    </div>
  );
};

export default IntroOverlay;
