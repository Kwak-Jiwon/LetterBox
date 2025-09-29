// frontend/src/components/NewsletterList.jsx

import React from 'react';
import NewsletterCard from './NewsletterCard.jsx'; // 새로 만든 카드 컴포넌트 import
import './NewsletterList.css';

function NewsletterList({ newsletters, category, onSelectNewsletter }) {
  return (
    <div className="list-container">
      <header className="list-header">
        <h1 className="main-title">{category}</h1>
        <div className="toolbar">
          {/* 여기에 검색, 필터 등의 UI가 들어갈 수 있습니다. */}
          <input type="search" placeholder="검색..." className="search-bar" />
        </div>
      </header>
      
      {/* 실제 뉴스레터 카드들이 표시될 그리드 영역 */}
      <div className="newsletter-grid">
        {newsletters.length > 0 ? (
          newsletters.map(item => (
            <NewsletterCard 
              key={item.id} 
              item={item} 
              onClick={() => onSelectNewsletter(item)} 
            />
          ))
        ) : (
          <p>이 카테고리에는 뉴스레터가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default NewsletterList;