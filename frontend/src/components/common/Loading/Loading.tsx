import React from 'react';
import './Loading.css';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  color?: 'primary' | 'secondary' | 'white';
  fullScreen?: boolean;
  overlay?: boolean;
  text?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  fullScreen = false,
  overlay = false,
  text,
  className = '',
}) => {
  const containerClasses = [
    'loading',
    fullScreen && 'loading-fullscreen',
    overlay && 'loading-overlay',
    className,
  ].filter(Boolean).join(' ');

  const indicatorClasses = [
    'loading-indicator',
    `loading-${variant}`,
    `loading-${size}`,
    `loading-${color}`,
  ].filter(Boolean).join(' ');

  const renderIndicator = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={indicatorClasses}>
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        );
      case 'pulse':
        return <div className={indicatorClasses} />;
      case 'spinner':
      default:
        return <div className={indicatorClasses} />;
    }
  };

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {renderIndicator()}
      {text && <span className="loading-text">{text}</span>}
      <span className="sr-only">로딩 중...</span>
    </div>
  );
};

export default Loading;
