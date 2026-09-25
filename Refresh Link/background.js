const tabTimers = {};

// Function to start refreshing a tab at a given interval
function startRefreshing(tabId, interval) {
  if (tabTimers[tabId]) {
    clearInterval(tabTimers[tabId]);
  }
  tabTimers[tabId] = setInterval(() => {
    chrome.tabs.reload(tabId);
  }, interval * 1000);
}

// Function to stop refreshing a tab
function stopRefreshing(tabId) {
  if (tabTimers[tabId]) {
    clearInterval(tabTimers[tabId]);
    delete tabTimers[tabId];
  }
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'addTab') {
    const { tabId, interval } = message;
    startRefreshing(tabId, interval);
  }
});

// Clean up timers when tabs are closed and remove unused URLs
chrome.tabs.onRemoved.addListener((tabId) => {
  stopRefreshing(tabId);

  // Directly check all open tabs to update stored URLs
  chrome.storage.sync.get(['urls'], (result) => {
    let urls = result.urls || [];
    chrome.tabs.query({}, (tabs) => {
      const openUrls = tabs.map(t => t.url);
      const filteredUrls = urls.filter(item => openUrls.includes(item.url));
      if (filteredUrls.length !== urls.length) {
        chrome.storage.sync.set({ urls: filteredUrls });
      }
    });
  });
});
