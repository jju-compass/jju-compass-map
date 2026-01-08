import React, { useEffect } from 'react';
import Router from './Router';
import { useThemeStore, getEffectiveTheme } from './store/themeStore';
import './App.css';

const App: React.FC = () => {
  const { theme } = useThemeStore();

  // 테마 적용 effect
  useEffect(() => {
    const applyTheme = () => {
      const effectiveTheme = getEffectiveTheme(theme);
      document.documentElement.setAttribute('data-theme', effectiveTheme);
    };

    // 초기 테마 적용
    applyTheme();

    // system 모드일 때 OS 테마 변경 감지
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return <Router />;
};

export default App;
