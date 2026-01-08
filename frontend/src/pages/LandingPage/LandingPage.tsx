import React, { useEffect, useRef } from 'react';
import {
  IntroOverlay,
  LandingNavbar,
  HeroSection,
  FeaturesSection,
  CategoriesSection,
  CTASection,
  LandingFooter,
} from '../../components/landing';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 스크롤 애니메이션을 위한 Intersection Observer
    const animateElements = document.querySelectorAll(
      '.feature-item, .category-card, .cta-content, .section-header'
    );

    // 초기 상태 설정
    animateElements.forEach((el) => {
      el.classList.remove('animate');
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // 스태거 효과 (순차적으로 나타남)
            setTimeout(() => {
              entry.target.classList.add('animate');
            }, index * 100);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    animateElements.forEach((el) => observer.observe(el));

    return () => {
      animateElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-page">
      {/* 인트로 애니메이션 */}
      <IntroOverlay duration={2500} />

      {/* 스킵 내비게이션 */}
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>

      {/* 상단 네비게이션 */}
      <LandingNavbar />

      {/* 메인 콘텐츠 */}
      <main id="main-content">
        {/* 히어로 섹션 */}
        <HeroSection />

        {/* 주요 기능 */}
        <div ref={featuresRef}>
          <FeaturesSection />
        </div>

        {/* 카테고리 섹션 */}
        <div ref={categoriesRef}>
          <CategoriesSection />
        </div>

        {/* CTA 섹션 */}
        <div ref={ctaRef}>
          <CTASection />
        </div>
      </main>

      {/* 푸터 */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
