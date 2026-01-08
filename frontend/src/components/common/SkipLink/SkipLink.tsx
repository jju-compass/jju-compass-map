import React from 'react';
import './SkipLink.css';

interface SkipLinkProps {
  targetId: string;
  children?: React.ReactNode;
}

/**
 * 스킵 링크 컴포넌트 (스크린 리더 접근성)
 * - Tab 키로 포커스 시 표시
 * - 주요 콘텐츠로 바로 이동
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  children = '본문으로 바로가기',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a href={`#${targetId}`} className="skip-link" onClick={handleClick}>
      {children}
    </a>
  );
};

export default SkipLink;
