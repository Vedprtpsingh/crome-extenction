document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const intervalInput = document.getElementById('intervalInput');
  const urlList = document.getElementById('urlList');

  // Load saved URLs and intervals from storage and display
  function loadUrls() {
    chrome.storage.sync.get(['urls'], (result) => {
      const urls = result.urls || [];
      urlList.innerHTML = '';
      urls.forEach(({ url, interval }) => {
        const li = document.createElement('li');
        li.textContent = url + ' ';
        const span = document.createElement('span');
        span.className = 'interval';
        span.textContent = `(Refresh every ${interval} seconds)`;
        li.appendChild(span);
        urlList.appendChild(li);
      });
    });
  }

  // Add new URL and interval
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    const interval = parseInt(intervalInput.value, 10);

    if (!url || isNaN(interval) || interval < 5) {
      alert('Please enter a valid URL and interval (minimum 5 seconds).');
      return;
    }

    // Save to storage
    chrome.storage.sync.get(['urls'], (result) => {
      const urls = result.urls || [];
      // Check if URL already exists
      if (urls.some(item => item.url === url)) {
        alert('This URL is already added.');
        return;
      }
      urls.push({ url, interval });
      chrome.storage.sync.set({ urls }, () => {
        // Open new tab for the URL
        chrome.tabs.create({ url }, (tab) => {
          // Notify background script to start refreshing this tab
          chrome.runtime.sendMessage({ action: 'addTab', tabId: tab.id, url, interval });
        });
        loadUrls();
        urlInput.value = '';
        intervalInput.value = 60;
      });
    });
  });

  loadUrls();

  // Listen for storage changes to update the list dynamically
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.urls) {
      loadUrls();
    }
  });
});
