const API_URL = 'http://127.0.0.1:5000/api/newsletters';

// 뉴스레터를 가져와서 스토리지에 저장하는 함수
async function fetchAndStoreNewsletters() {
  console.log('Fetching newsletters...');
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const newsletters = await response.json();
    
    // chrome.storage.local에 저장
    chrome.storage.local.set({ newsletters: newsletters }, () => {
      console.log('Newsletters data saved.');
    });

  } catch (error) {
    console.error("Failed to fetch newsletters:", error);
  }
}

// 확장프로그램이 처음 설치되었을 때 실행
chrome.runtime.onInstalled.addListener(() => {
  console.log('Newsletter extension installed.');
  // 즉시 한번 실행
  fetchAndStoreNewsletters();
  
  // 'fetch_newsletters'라는 이름의 알람 생성 (60분마다 실행)
  chrome.alarms.create('fetch_newsletters', {
    delayInMinutes: 1, // 1분 후 시작
    periodInMinutes: 60 // 60분 간격
  });
});

// 알람이 울릴 때마다 실행
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetch_newsletters') {
    fetchAndStoreNewsletters();
  }
});