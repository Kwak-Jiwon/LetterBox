// frontend/src/components/NewsletterDetail.jsx

import React, { useState } from 'react';
import './NewsletterDetail.css';

// 아이콘을 사용하기 위해 임시로 텍스트 아이콘을 넣어둡니다.
const BackIcon = () => '←'; 
const HighlightIcon = () => '✨';
const CategoryIcon = () => '📂';
const SummaryIcon = () => '📝';

function NewsletterDetail({ newsletter, onBack }) {
  const [aiSummary, setAiSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarizeClick = async () => {
    if (!newsletter?.body) {
      setAiSummary("요약할 원본 데이터가 없습니다.");
      return;
    }
    
    setIsLoading(true);
    setAiSummary(''); 
    try {
      const response = await fetch('http://127.0.0.1:5000/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newsletter.body }), 
      });

      if (!response.ok) throw new Error('API 응답 오류');
      const data = await response.json();
      setAiSummary(data.summary); 

    } catch (error) {
      console.error("요약 실패:", error);
      setAiSummary("요약문을 생성하는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };
  React.useEffect(() => {
    if (newsletter) {
      console.log("상세 뷰에 전달된 newsletter.body 내용:", newsletter.body);
    }
  }, [newsletter]);

  if (!newsletter) {
    return <div className="detail-container">뉴스레터를 선택해주세요.</div>
  }

  return (
    <div className="detail-container">
      <header className="detail-page-header">
        <button onClick={onBack} className="detail-back-button">
          <BackIcon /> 목록으로 돌아가기
        </button>
      </header>

      <div className="detail-card">
        <h2 className="detail-subject">{newsletter.subject}</h2>
        <p className="detail-sender">{newsletter.sender}</p>

        <div className="detail-actions">
          <button onClick={handleSummarizeClick} className="action-button" disabled={isLoading}>
            <SummaryIcon /> {isLoading ? '요약 중...' : 'AI 요약'}
          </button>
          <button className="action-button">
            <HighlightIcon /> 하이라이트
          </button>
          <select className="action-select">
            <option disabled selected>
              <CategoryIcon /> 카테고리 변경
            </option>
            <option>기술</option>
            <option>경제</option>
            <option>디자인</option>
            <option>미분류</option>
          </select>
        </div>
        
        <div className="detail-content-area">
          <h3>{aiSummary ? 'AI 요약' : '전체 본문'}</h3>
          
          {/* 여기가 핵심: aiSummary가 있으면 p 태그로, 없으면 iframe으로 본문을 렌더링합니다. */}
          {aiSummary ? (
            <p className="ai-summary-text">{aiSummary}</p>
          ) : (
            <iframe
              srcDoc={newsletter.body || '<html><body>표시할 본문 내용이 없습니다.</body></html>'}
              className="email-iframe"
              title={newsletter.subject}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default NewsletterDetail;