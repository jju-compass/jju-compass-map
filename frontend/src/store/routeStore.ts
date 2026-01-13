import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coordinates } from '../types';

interface RouteState {
  // 홈 위치
  homePosition: Coordinates | null;
  setHomePosition: (position: Coordinates | null) => void;

  // 출발지
  startPosition: Coordinates | null;
  setStartPosition: (position: Coordinates | null) => void;

  // 모달 상태
  isHomeModalOpen: boolean;
  setHomeModalOpen: (open: boolean) => void;

  isRouteModalOpen: boolean;
  setRouteModalOpen: (open: boolean) => void;

  // 선택 모드
  homePickMode: boolean;
  setHomePickMode: (mode: boolean) => void;

  startPickMode: boolean;
  setStartPickMode: (mode: boolean) => void;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      // 홈 위치
      homePosition: null,
      setHomePosition: (position) => set({ homePosition: position }),

      // 출발지
      startPosition: null,
      setStartPosition: (position) => set({ startPosition: position }),

      // 모달 상태
      isHomeModalOpen: false,
      setHomeModalOpen: (open) => set({ isHomeModalOpen: open }),

      isRouteModalOpen: false,
      setRouteModalOpen: (open) => set({ isRouteModalOpen: open }),

      // 선택 모드
      homePickMode: false,
      setHomePickMode: (mode) => set({ homePickMode: mode }),

      startPickMode: false,
      setStartPickMode: (mode) => set({ startPickMode: mode }),
    }),
    {
      name: 'jju-route-storage',
      partialize: (state) => ({
        homePosition: state.homePosition,
      }),
    }
  )
);

export default useRouteStore;
