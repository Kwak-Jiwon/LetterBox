// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import './App.css';
import CategorySidebar from './components/CategorySidebar.jsx';
import NewsletterList from './components/NewsletterList.jsx';
import NewsletterDetail from './components/NewsletterDetail.jsx';

function App() {
  // 전체 뉴스레터 목록을 저장할 상태
  const [allNewsletters, setAllNewsletters] = useState([]);
  
  // 어떤 카테고리를 선택했는지 기억하는 상태
  const [selectedCategory, setSelectedCategory] = useState('전체보기');
  
  // 어떤 뉴스레터를 상세 보기할지 기억하는 상태 (선택 안됐으면 null)
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);

  // 처음 렌더링될 때 chrome.storage에서 전체 뉴스레터 데이터를 가져옵니다.
  useEffect(() => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['newsletters'], (result) => {
        if (result.newsletters && Array.isArray(result.newsletters)) {
          // 실제로는 여기에 카테고리 정보도 추가해야 합니다. (임시)
          const newslettersWithCategory = result.newsletters.map(n => ({...n, category: '미분류'}));
          setAllNewsletters(newslettersWithCategory);
        }
      });
    }
  }, []);

  // 선택된 카테고리에 따라 뉴스레터를 필터링합니다.
  const filteredNewsletters = selectedCategory === '전체보기'
    ? allNewsletters
    : allNewsletters.filter(n => n.category === selectedCategory);

  // 카테고리를 선택하면, 상세 뷰를 닫고 목록 뷰로 돌아갑니다.
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setSelectedNewsletter(null);
  };

  return (
    <div className="app-container">
      <CategorySidebar 
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory} 
      />
      <main className="main-content">
        {selectedNewsletter ? (
          <NewsletterDetail 
            newsletter={selectedNewsletter}
            onBack={() => setSelectedNewsletter(null)}
          />
        ) : (
          <NewsletterList 
            newsletters={filteredNewsletters}
            category={selectedCategory}
            onSelectNewsletter={setSelectedNewsletter}
          />
        )}
      </main>
    </div>
  );
}

export default App;