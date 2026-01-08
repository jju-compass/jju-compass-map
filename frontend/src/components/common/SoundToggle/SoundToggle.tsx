import React from 'react';
import { useSoundStore, SoundEffects } from '../../../utils/soundEffects';
import './SoundToggle.css';

/**
 * 사운드 토글 버튼
 */
export const SoundToggle: React.FC = () => {
  const { enabled, toggle } = useSoundStore();

  const handleClick = () => {
    toggle();
    // 토글 시 클릭 사운드 재생 (켜질 때만)
    if (!enabled) {
      setTimeout(() => SoundEffects.playClick(), 50);
    }
  };

  return (
    <button
      className={`sound-toggle ${enabled ? 'enabled' : 'disabled'}`}
      onClick={handleClick}
      aria-label={enabled ? '사운드 끄기' : '사운드 켜기'}
      title={enabled ? '사운드 끄기' : '사운드 켜기'}
    >
      {enabled ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
};

export default SoundToggle;
