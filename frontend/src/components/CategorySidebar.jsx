// frontend/src/components/CategorySidebar.jsx

import React from 'react';
import './CategorySidebar.css';

// 부모로부터 selectedCategory, onSelectCategory 함수를 props로 받습니다.
function CategorySidebar({ selectedCategory, onSelectCategory }) {
  const categories = ['전체보기', '기술', '경제', '디자인', '미분류'];

  return (
    <aside className="sidebar">
      <h1 className="sidebar-title">카테고리</h1>
      <ul className="category-list">
        {categories.map(category => (
          // 클릭 시 onSelectCategory 함수를 호출하여 부모에게 알립니다.
          // 현재 선택된 카테고리면 'active' 클래스를 추가하여 시각적으로 표시합니다.
          <li 
            key={category} 
            className={`category-item ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default CategorySidebar;