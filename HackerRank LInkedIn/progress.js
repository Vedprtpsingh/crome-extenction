const numberEl = document.getElementById('progress-number');
const usernameEl = document.getElementById('progress-username');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateProgress') {
    numberEl.textContent = message.current + ' / ' + message.total;
    usernameEl.textContent = message.username || '';
  }
});
