import { useCallback } from 'react';
import { useUserStore } from '../store';
import { historyAPI } from '../api';

export function useHistory() {
  const { 
    history, 
    setHistory, 
    popularKeywords, 
    setPopularKeywords,
    clearHistory: clearHistoryStore 
  } = useUserStore();

  // 최근 검색 기록 로드
  const loadHistory = useCallback(async () => {
    try {
      const response = await historyAPI.getRecent(20);
      setHistory(response.history || []);
    } catch (error) {
      console.warn('Failed to load history:', error);
      setHistory([]);
    }
  }, [setHistory]);

  // 인기 검색어 로드
  const loadPopularKeywords = useCallback(async () => {
    try {
      const response = await historyAPI.getPopular(10);
      setPopularKeywords(response.keywords || []);
    } catch (error) {
      console.warn('Failed to load popular keywords:', error);
      setPopularKeywords([]);
    }
  }, [setPopularKeywords]);

  // 검색 기록 전체 삭제
  const clearHistory = useCallback(async () => {
    try {
      await historyAPI.clear();
      clearHistoryStore();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, [clearHistoryStore]);

  return { 
    history, 
    popularKeywords, 
    loadHistory, 
    loadPopularKeywords, 
    clearHistory 
  };
}

export default useHistory;
