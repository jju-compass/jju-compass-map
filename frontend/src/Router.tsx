import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  LandingPage,
  MapPage,
  AboutPage,
  GuidePage,
  SurveyPage,
  NotFoundPage,
} from './pages';

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
