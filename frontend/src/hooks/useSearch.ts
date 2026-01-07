import { useCallback } from 'react';
import { useMapStore, useUserStore } from '../store';
import { cacheAPI, historyAPI } from '../api';
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
      // Check cache first
      const cached = await cacheAPI.getSearch(keyword);
      if (cached.cached && cached.results) {
        setSearchResults(cached.results);
        setIsLoading(false);
        return cached.results;
      }

      // Use Kakao Places search
      const places = new kakao.maps.services.Places();
      
      return new Promise<Place[]>((resolve, reject) => {
        places.keywordSearch(keyword, async (data, status) => {
          if (status === kakao.maps.services.Status.OK) {
            const results = data as unknown as Place[];
            setSearchResults(results);
            
            // Cache results
            try {
              await cacheAPI.setSearch(keyword, results, 30);
            } catch (e) {
              console.warn('Failed to cache search results:', e);
            }
            
            resolve(results);
          } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            setSearchResults([]);
            resolve([]);
          } else {
            reject(new Error('검색에 실패했습니다'));
          }
          setIsLoading(false);
        }, {
          // Search near JJU
          x: 127.1353,
          y: 35.8428,
          radius: 5000,
        });
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : '검색에 실패했습니다');
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
