import React from 'react';
import { Link } from 'react-router-dom';
import './CategoriesSection.css';

const categories = [
  { emoji: '🍚', name: '한식', description: '전주대 주변 한식당', keyword: '한식' },
  { emoji: '🥟', name: '중식', description: '중국 음식점', keyword: '중식' },
  { emoji: '🍣', name: '일식', description: '일본 음식점', keyword: '일식' },
  { emoji: '🍕', name: '양식', description: '양식당, 패스트푸드', keyword: '양식' },
  { emoji: '☕', name: '카페', description: '주변 카페 찾기', keyword: '카페' },
  { emoji: '🏪', name: '편의점', description: '24시간 편의점', keyword: '편의점' },
  { emoji: '💊', name: '약국', description: '주변 약국 찾기', keyword: '약국' },
  { emoji: '🏥', name: '병원', description: '병원, 의원', keyword: '병원' },
  { emoji: '🏦', name: '은행/ATM', description: '은행, ATM 찾기', keyword: '은행' },
  { emoji: '✏️', name: '문구점', description: '문구점, 서점', keyword: '문구점' },
  { emoji: '💇', name: '미용실', description: '미용실, 이발소', keyword: '미용실' },
  { emoji: '💪', name: '헬스장', description: '헬스장, 체육관', keyword: '헬스장' },
];

const CategoriesSection: React.FC = () => {
  return (
    <section className="categories" id="categories">
      <div className="categories-content">
        <div className="section-header">
          <h2>카테고리</h2>
          <p>원하는 카테고리를 선택해서 빠르게 검색하세요</p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              key={category.keyword}
              to={`/map?category=${encodeURIComponent(category.keyword)}`}
              className="category-card"
            >
              <div className="category-emoji">{category.emoji}</div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
