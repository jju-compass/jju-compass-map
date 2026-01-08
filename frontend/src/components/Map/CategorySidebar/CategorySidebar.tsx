import React from 'react';
import { Icon, type IconName } from '@components/common';
import './CategorySidebar.css';

export interface Category {
  id: string;
  name: string;
  icon: IconName;
  searchKeyword: string;
}

export interface CategoryGroup {
  name: string;
  categories: Category[];
}

export const categoryData: CategoryGroup[] = [
  {
    name: '음식점',
    categories: [
      { id: 'all-food', name: '전체', icon: 'food', searchKeyword: '음식점' },
      { id: 'korean', name: '한식', icon: 'rice', searchKeyword: '한식' },
      { id: 'chinese', name: '중식', icon: 'noodle', searchKeyword: '중식' },
      { id: 'japanese', name: '일식', icon: 'sushi', searchKeyword: '일식' },
      { id: 'western', name: '양식', icon: 'pasta', searchKeyword: '양식' },
      { id: 'snack', name: '분식', icon: 'snack', searchKeyword: '분식' },
    ],
  },
  {
    name: '기타',
    categories: [
      { id: 'cafe', name: '카페', icon: 'cafe', searchKeyword: '카페' },
      { id: 'convenience', name: '편의점', icon: 'store', searchKeyword: '편의점' },
      { id: 'pharmacy', name: '약국', icon: 'pharmacy', searchKeyword: '약국' },
      { id: 'hospital', name: '병원', icon: 'hospital', searchKeyword: '병원' },
      { id: 'bank', name: '은행/ATM', icon: 'bank', searchKeyword: '은행' },
      { id: 'stationery', name: '문구점', icon: 'pencil', searchKeyword: '문구점' },
      { id: 'salon', name: '미용실', icon: 'scissors', searchKeyword: '미용실' },
      { id: 'pcroom', name: 'PC방', icon: 'computer', searchKeyword: 'PC방' },
      { id: 'gym', name: '헬스장', icon: 'dumbbell', searchKeyword: '헬스장' },
      { id: 'karaoke', name: '노래방', icon: 'mic', searchKeyword: '노래방' },
    ],
  },
];

export interface CategorySidebarProps {
  selectedCategoryId: string | null;
  onCategorySelect: (category: Category) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  selectedCategoryId,
  onCategorySelect,
  isOpen = true,
  onClose,
}) => {
  const classes = [
    'category-sidebar',
    isOpen && 'category-sidebar-open',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="category-sidebar-overlay" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside className={classes}>
        <div className="category-sidebar-header">
          <h2 className="category-sidebar-title">카테고리</h2>
          <button
            className="category-sidebar-close"
            onClick={onClose}
            aria-label="사이드바 닫기"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        <nav className="category-sidebar-content">
          {categoryData.map((group) => (
            <div key={group.name} className="category-group">
              <h3 className="category-group-title">{group.name}</h3>
              <ul className="category-list">
                {group.categories.map((category) => (
                  <li key={category.id}>
                    <button
                      className={`category-item ${
                        selectedCategoryId === category.id ? 'category-item-active' : ''
                      }`}
                      onClick={() => onCategorySelect(category)}
                      aria-current={selectedCategoryId === category.id ? 'page' : undefined}
                    >
                      <Icon name={category.icon} size="sm" />
                      <span className="category-item-name">{category.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default CategorySidebar;
