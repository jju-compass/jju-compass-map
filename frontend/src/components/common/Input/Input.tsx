import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onIconClick?: () => void;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  iconPosition = 'left',
  onIconClick,
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const wrapperClasses = [
    'input-wrapper',
    fullWidth && 'input-full',
    error && 'input-error',
    icon && `input-has-icon-${iconPosition}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {icon && iconPosition === 'left' && (
          <span 
            className="input-icon input-icon-left"
            onClick={onIconClick}
            role={onIconClick ? 'button' : undefined}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className="input-field"
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <span 
            className="input-icon input-icon-right"
            onClick={onIconClick}
            role={onIconClick ? 'button' : undefined}
          >
            {icon}
          </span>
        )}
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
