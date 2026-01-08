import React from 'react';
import { Icon, type IconName } from '@components/common';
import './CategoryHeader.css';

export interface CategoryHeaderProps {
  categoryName: string;
  categoryIcon: IconName;
  description?: string;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  categoryName,
  categoryIcon,
  description,
}) => {
  const defaultDescription = `주변의 ${categoryName}을(를) 확인하세요`;

  return (
    <header className="category-header">
      <div className="category-header-icon">
        <Icon name={categoryIcon} size={28} />
      </div>
      <div className="category-header-content">
        <h1 className="category-header-title">{categoryName}</h1>
        <p className="category-header-description">
          {description || defaultDescription}
        </p>
      </div>
    </header>
  );
};

export default CategoryHeader;
