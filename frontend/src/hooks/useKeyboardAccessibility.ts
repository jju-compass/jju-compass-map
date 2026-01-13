import { useEffect } from 'react';

/**
 * 키보드 접근성 훅
 * - ESC 키로 모달/패널 닫기
 * - 화살표 키로 리스트 탐색
 * - Enter/Space로 선택
 */

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  enabled?: boolean;
}

/**
 * 전역 키보드 이벤트 훅
 */
export function useKeyboardShortcuts(options: UseKeyboardNavigationOptions) {
  const { onEscape, onEnter, onArrowUp, onArrowDown, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Input/Textarea에서는 무시
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // ESC는 input에서도 동작
        if (e.key === 'Escape' && onEscape) {
          onEscape();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
          onEnter?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown]);
}
