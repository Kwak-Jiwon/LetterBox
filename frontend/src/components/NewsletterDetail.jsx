// frontend/src/components/NewsletterDetail.jsx
import React, { useState } from 'react';
import './NewsletterDetail.css';

// ... 아이콘 컴포넌트들 ...

function NewsletterDetail({ newsletter, onBack }) {
  const [aiSummary, setAiSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarizeClick = async () => {
    // 요약할 본문이 없으면 실행하지 않음
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

  // newsletter 객체가 없을 경우를 대비한 렌더링
  if (!newsletter) {
    return <div className="detail-container">뉴스레터를 선택해주세요.</div>
  }

  return (
    <div className="detail-container">
      <header className="detail-page-header">
        <button onClick={onBack} className="detail-back-button">
          ← 목록으로 돌아가기
        </button>
      </header>

      <div className="detail-card">
        <h2 className="detail-subject">{newsletter.subject}</h2>
        <p className="detail-sender">{newsletter.sender}</p>

        <div className="detail-actions">
           {/* ... 버튼들 ... */}
        </div>
        
        <div className="detail-content-area">
          <h3>{aiSummary ? 'AI 요약' : '전체 본문'}</h3>
          {/* newsletter.body가 비어있을 경우를 대비한 메시지 추가 */}
          <p>{aiSummary || newsletter.body || "표시할 본문 내용이 없습니다."}</p>
        </div>
      </div>
    </div>
  );
}

export default NewsletterDetail;