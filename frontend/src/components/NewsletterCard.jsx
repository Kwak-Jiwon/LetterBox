// frontend/src/components/NewsletterCard.jsx
import React from 'react';
import './NewsletterCard.css';

// 뉴스레터 데이터(item)와 클릭 이벤트 핸들러(onClick)를 props로 받습니다.
function NewsletterCard({ item, onClick }) {
  // 간단한 해시 함수로 아이템 ID에 따라 다른 placeholder 이미지를 보여줍니다.
  const imageId = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 50;

  return (
    <div className="newsletter-card" onClick={onClick}>
      <div className="card-thumbnail">
        {/* 실제로는 뉴스레터에서 추출한 이미지를 사용해야 합니다. */}
        <img src={`https://picsum.photos/id/${imageId}/300/200`} alt={item.subject} />
      </div>
      <div className="card-content">
        <h3 className="card-subject">{item.subject}</h3>
        <p className="card-sender">{item.sender}</p>
      </div>
    </div>
  );
}

export default NewsletterCard;