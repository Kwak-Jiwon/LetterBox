document.addEventListener('DOMContentLoaded', () => {
  const listElement = document.getElementById('newsletter-list');

  // chrome.storage에서 'newsletters' 데이터를 가져옴
  chrome.storage.local.get(['newsletters'], (result) => {
    listElement.innerHTML = ''; // 기본 '로딩 중' 메시지 삭제
    const newsletters = result.newsletters;

    if (newsletters && newsletters.length > 0) {
      newsletters.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="sender">${item.sender}</div>
          <div class="subject">${item.subject}</div>
        `;
        listElement.appendChild(li);
      });
    } else {
      listElement.innerHTML = '<li>새로운 뉴스레터가 없습니다.</li>';
    }
  });
});