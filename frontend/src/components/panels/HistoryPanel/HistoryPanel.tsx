import React from 'react';
import { Button, Icon, Loading } from '@components/common';
import type { SearchHistory } from '../../../types';
import './HistoryPanel.css';

export interface HistoryPanelProps {
  history: SearchHistory[];
  isLoading?: boolean;
  onSelect?: (keyword: string) => void;
  onRemove?: (id: number) => void;
  onClearAll?: () => void;
  onClose?: () => void;
  className?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  isLoading = false,
  onSelect,
  onRemove,
  onClearAll,
  onClose,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const classes = ['history-panel', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {/* Header */}
      <div className="history-panel-header">
        <h2 className="history-panel-title">
          <Icon name="history" size="md" />
          검색 기록
        </h2>
        <div className="history-panel-header-actions">
          {history.length > 0 && onClearAll && (
            <button className="history-panel-clear" onClick={onClearAll}>
              전체 삭제
            </button>
          )}
          {onClose && (
            <button className="history-panel-close" onClick={onClose} aria-label="닫기">
              <Icon name="close" size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="history-panel-content">
        {isLoading ? (
          <div className="history-panel-loading">
            <Loading size="md" text="불러오는 중..." />
          </div>
        ) : history.length === 0 ? (
          <div className="history-panel-empty">
            <Icon name="history" size="lg" />
            <p>검색 기록이 없습니다</p>
            <span>장소를 검색하면 여기에 기록됩니다.</span>
          </div>
        ) : (
          <ul className="history-panel-list">
            {history.map((item) => (
              <li key={item.id} className="history-item">
                <button
                  className="history-item-content"
                  onClick={() => onSelect?.(item.keyword)}
                >
                  <Icon name="clock" size="sm" />
                  <div className="history-item-info">
                    <span className="history-item-keyword">{item.keyword}</span>
                    <span className="history-item-meta">
                      {item.result_count}건 · {formatDate(item.searched_at)}
                    </span>
                  </div>
                </button>
                {onRemove && (
                  <button
                    className="history-item-remove"
                    onClick={() => onRemove(item.id)}
                    aria-label="삭제"
                    title="삭제"
                  >
                    <Icon name="close" size="sm" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
