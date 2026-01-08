import { useEffect, useCallback, useRef } from 'react';

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

/**
 * 리스트 키보드 탐색 훅
 */
export function useListNavigation<T>(
  items: T[],
  onSelect: (item: T, index: number) => void
) {
  const focusedIndexRef = useRef<number>(-1);
  const containerRef = useRef<HTMLElement | null>(null);

  const setContainerRef = useCallback((el: HTMLElement | null) => {
    containerRef.current = el;
  }, []);

  const focusItem = useCallback((index: number) => {
    if (!containerRef.current || index < 0 || index >= items.length) return;

    const focusableItems = containerRef.current.querySelectorAll('[data-list-item]');
    const item = focusableItems[index] as HTMLElement;
    if (item) {
      item.focus();
      focusedIndexRef.current = index;
    }
  }, [items.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < items.length - 1) {
            focusItem(currentIndex + 1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            focusItem(currentIndex - 1);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (items[currentIndex]) {
            onSelect(items[currentIndex], currentIndex);
          }
          break;
        case 'Home':
          e.preventDefault();
          focusItem(0);
          break;
        case 'End':
          e.preventDefault();
          focusItem(items.length - 1);
          break;
      }
    },
    [items, focusItem, onSelect]
  );

  return {
    setContainerRef,
    handleKeyDown,
    focusItem,
    focusedIndex: focusedIndexRef.current,
  };
}

/**
 * Focus Trap 훅 (모달용)
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // 이전 포커스 저장
    previouslyFocusedRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = container.querySelectorAll<HTMLElement>(focusableSelectors);

    if (focusables.length === 0) return;

    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    // 첫 번째 요소에 포커스
    firstFocusable.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // 이전 포커스 복원
      previouslyFocusedRef.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * ARIA 라이브 리전 알림 훅
 */
export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // 기존 알림 제거
    const existing = document.getElementById('aria-live-region');
    if (existing) {
      existing.remove();
    }

    // 새 알림 생성
    const region = document.createElement('div');
    region.id = 'aria-live-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.textContent = message;

    document.body.appendChild(region);

    // 알림 후 제거
    setTimeout(() => region.remove(), 1000);
  }, []);

  return announce;
}

export default {
  useKeyboardShortcuts,
  useListNavigation,
  useFocusTrap,
  useAnnounce,
};
