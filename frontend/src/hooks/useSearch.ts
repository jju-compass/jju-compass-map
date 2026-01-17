import { useCallback, useRef } from 'react';
import { useMapStore } from '../store';
import { cacheAPI } from '../api';
import type { Place } from '../types';

const MAX_PAGES = 3; // 최대 3페이지 (45개)

export function useSearch() {
  const { setSearchResults, setIsLoading, setError, setShowOnlyFavorites } = useMapStore();
  const allResultsRef = useRef<Place[]>([]);

  const search = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    // 검색 시 즐겨찾기 필터 모드 해제
    setShowOnlyFavorites(false);

    setIsLoading(true);
    setError(null);
    allResultsRef.current = [];

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
        let currentPage = 1;

        const searchCallback = async (
          data: kakao.maps.services.PlacesSearchResult[],
          status: kakao.maps.services.Status,
          pagination: kakao.maps.services.Pagination
        ) => {
          if (status === kakao.maps.services.Status.OK) {
            // 현재 페이지 결과 추가
            const pageResults = data as unknown as Place[];
            allResultsRef.current = [...allResultsRef.current, ...pageResults];
            
            // 다음 페이지가 있고, 최대 페이지 미만이면 계속 로드
            if (pagination.hasNextPage && currentPage < MAX_PAGES) {
              currentPage++;
              pagination.nextPage();
            } else {
              // 모든 페이지 로드 완료
              const finalResults = allResultsRef.current;
              setSearchResults(finalResults);
              
              // 캐시 저장 (실패해도 무시)
              try {
                await cacheAPI.setSearch(keyword, finalResults, 30);
              } catch (e) {
                console.warn('Failed to cache search results:', e);
              }
              
              setIsLoading(false);
              resolve(finalResults);
            }
          } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            setSearchResults([]);
            setIsLoading(false);
            resolve([]);
          } else {
            setError('검색에 실패했습니다');
            setIsLoading(false);
            reject(new Error('검색에 실패했습니다'));
          }
        };

        places.keywordSearch(keyword, searchCallback, {
          // 전주대학교 정문 주변 검색
          x: 127.09236571436321,
          y: 35.814445811028584,
          radius: 2000,
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '검색에 실패했습니다';
      setError(errorMessage);
      setIsLoading(false);
      throw error;
    }
  }, [setSearchResults, setIsLoading, setError, setShowOnlyFavorites]);

  return { search };
}

export default useSearch;
