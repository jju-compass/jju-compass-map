import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loading } from './components/common/Loading/Loading';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'));
const MapPage = lazy(() => import('./pages/MapPage/MapPage'));
const AboutPage = lazy(() => import('./pages/AboutPage/AboutPage'));
const GuidePage = lazy(() => import('./pages/GuidePage/GuidePage'));
const SurveyPage = lazy(() => import('./pages/SurveyPage/SurveyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage/NotFoundPage'));

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading fullScreen text="페이지 로딩 중..." />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;
