import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const current = get().theme;
        // light -> dark -> system -> light 순환
        const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
        set({ theme: next });
      },
    }),
    {
      name: 'jju-theme-settings',
    }
  )
);

/**
 * 실제 적용될 테마 계산 (system일 경우 OS 설정 확인)
 */
export const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme;
};

/**
 * 테마 아이콘 반환
 */
export const getThemeIcon = (theme: Theme): string => {
  switch (theme) {
    case 'light':
      return 'sun';
    case 'dark':
      return 'moon';
    case 'system':
      return 'monitor';
  }
};

/**
 * 테마 라벨 반환
 */
export const getThemeLabel = (theme: Theme): string => {
  switch (theme) {
    case 'light':
      return '라이트 모드';
    case 'dark':
      return '다크 모드';
    case 'system':
      return '시스템 설정';
  }
};
