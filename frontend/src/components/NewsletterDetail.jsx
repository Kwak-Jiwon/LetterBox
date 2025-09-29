// frontend/src/components/NewsletterDetail.jsx

import React, { useState, useRef } from 'react';
import './NewsletterDetail.css';

const BackIcon = () => '←'; 
const HighlightIcon = () => '✨';
const CategoryIcon = () => '📂';
const SummaryIcon = () => '📝';

function NewsletterDetail({ newsletter, onBack }) {
  const [aiSummary, setAiSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);

  const handleSummarizeClick = async () => {
    if (!iframeRef.current?.contentDocument?.body) {
      setAiSummary("요약할 원본 데이터를 읽을 수 없습니다.");
      return;
    }
    const textContent = iframeRef.current.contentDocument.body.innerText;
    setIsLoading(true);
    setAiSummary(''); 
    try {
      const response = await fetch('http://127.0.0.1:5000/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textContent }), 
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

  const handleHighlightClick = () => {
    if (!iframeRef.current?.contentDocument?.body) return;

    const iframeDoc = iframeRef.current.contentDocument;
    const keywords = ['AI', '엔비디아', '오픈AI', '트럼프', '한국', '구글']; // 하이라이트할 키워드 예시
    
    // 1. 하이라이트 스타일을 iframe 내부에 주입
    let style = iframeDoc.getElementById('highlight-style');
    if (!style) {
      style = iframeDoc.createElement('style');
      style.id = 'highlight-style';
      style.textContent = `
        .highlight {
          background-color: #fde047;
          color: #1f2937;
          padding: 1px 0;
          border-radius: 3px;
        }
      `;
      iframeDoc.head.appendChild(style);
    }

    // 2. 기존 하이라이트 제거
    const existingHighlights = iframeDoc.querySelectorAll('mark.highlight');
    existingHighlights.forEach(mark => {
      mark.outerHTML = mark.innerHTML;
    });
    
    // 3. 키워드를 찾아 <mark> 태그로 감싸기
    keywords.forEach(keyword => {
      if (keyword.trim() === '') return;
      const regex = new RegExp(`(${keyword})`, 'gi');
      iframeDoc.body.innerHTML = iframeDoc.body.innerHTML.replace(
        regex,
        `<mark class="highlight">$1</mark>`
      );
    });
  };

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
          <button onClick={handleHighlightClick} className="action-button">
            <HighlightIcon /> 하이라이트
          </button>
          <select className="action-select">
            <option disabled selected> <CategoryIcon /> 카테고리 변경</option>
            <option>기술</option> <option>경제</option> <option>디자인</option> <option>미분류</option>
          </select>
        </div>
        
        <div className="detail-content-area">
          <h3>{aiSummary ? 'AI 요약' : '전체 본문'}</h3>
          {aiSummary ? (
            <p className="ai-summary-text">{aiSummary}</p>
          ) : (
            <iframe
              ref={iframeRef} // ref 연결
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