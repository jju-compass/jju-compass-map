import React from 'react';
import { useThemeStore, getThemeLabel, Theme } from '../../../store/themeStore';
import './ThemeToggle.css';

/**
 * 테마 토글 버튼 (Light → Dark → System 순환)
 */
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  const handleClick = () => {
    toggleTheme();
  };

  // 다음 테마 계산 (툴팁용)
  const getNextTheme = (current: Theme): Theme => {
    return current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
  };

  const nextTheme = getNextTheme(theme);
  const currentLabel = getThemeLabel(theme);
  const nextLabel = getThemeLabel(nextTheme);

  return (
    <button
      className={`theme-toggle theme-${theme}`}
      onClick={handleClick}
      aria-label={`현재: ${currentLabel}. 클릭하면 ${nextLabel}로 변경`}
      title={`${currentLabel} → ${nextLabel}`}
    >
      {/* Sun Icon - Light Mode */}
      {theme === 'light' && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}

      {/* Moon Icon - Dark Mode */}
      {theme === 'dark' && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}

      {/* Monitor Icon - System Mode */}
      {theme === 'system' && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
