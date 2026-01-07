import { useCallback } from 'react';
import { useMapStore, useUserStore } from '../store';
import { cacheAPI } from '../api';
import type { Place } from '../types';

export function useSearch() {
  const { setSearchResults, setIsLoading, setError, setSelectedPlace } = useMapStore();
  const { setSearchKeyword } = useUserStore();

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchKeyword(keyword);

    try {
      // 캐시 확인 - 실패해도 검색은 계속 진행
      let cached = null;
      try {
        cached = await cacheAPI.getSearch(keyword);
      } catch (e) {
        console.warn('Cache API unavailable, searching directly:', e);
      }

      if (cached && cached.cached && cached.results) {
        setSearchResults(cached.results);
        setIsLoading(false);
        return cached.results;
      }

      // Kakao Maps SDK 확인
      if (typeof kakao === 'undefined' || !kakao.maps || !kakao.maps.services) {
        throw new Error('Kakao Maps SDK가 로드되지 않았습니다');
      }

      // Kakao Places 검색
      const places = new kakao.maps.services.Places();
      
      return new Promise<Place[]>((resolve, reject) => {
        places.keywordSearch(keyword, async (data, status) => {
          if (status === kakao.maps.services.Status.OK) {
            const results = data as unknown as Place[];
            setSearchResults(results);
            
            // 캐시 저장 (실패해도 무시) - 백엔드에서 히스토리도 자동 저장됨
            try {
              await cacheAPI.setSearch(keyword, results, 30);
            } catch (e) {
              console.warn('Failed to cache search results:', e);
            }
            
            setIsLoading(false);
            resolve(results);
          } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            setSearchResults([]);
            setIsLoading(false);
            resolve([]);
          } else {
            setError('검색에 실패했습니다');
            setIsLoading(false);
            reject(new Error('검색에 실패했습니다'));
          }
        }, {
          // 전주대학교 주변 검색
          x: 127.1353,
          y: 35.8428,
          radius: 5000,
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '검색에 실패했습니다';
      setError(errorMessage);
      setIsLoading(false);
      throw error;
    }
  }, [setSearchResults, setIsLoading, setError, setSearchKeyword]);

  const selectPlace = useCallback((place: Place | null) => {
    setSelectedPlace(place);
  }, [setSelectedPlace]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSelectedPlace(null);
    setSearchKeyword('');
  }, [setSearchResults, setSelectedPlace, setSearchKeyword]);

  return { search, selectPlace, clearSearch };
}

export default useSearch;
