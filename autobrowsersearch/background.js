const searchUrls = {
  bing: 'https://www.bing.com/search?q=',
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q='
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start') {
    const { searchEngine, useCurrentTab, phrases } = message;
    startSearches(searchEngine, useCurrentTab, phrases);
  } else if (message.action === 'stop') {
    // Handled in the function
  }
});

function startSearches(searchEngine, useCurrentTab, phrases) {
  let tabId;
  let startIndex = 0;

  if (useCurrentTab) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        tabId = tabs[0].id;
        performSearches(tabId, searchEngine, phrases, startIndex);
      }
    });
  } else {
    const initialUrl = searchUrls[searchEngine] + encodeURIComponent(phrases[0]);
    chrome.tabs.create({ url: initialUrl }, (tab) => {
      tabId = tab.id;
      performSearches(tabId, searchEngine, phrases, 1);
    });
  }
}

function performSearches(tabId, searchEngine, phrases, startIndex) {
  let stopped = false;

  const stopListener = (message) => {
    if (message.action === 'stop') {
      stopped = true;
      chrome.runtime.onMessage.removeListener(stopListener);
    }
  };

  chrome.runtime.onMessage.addListener(stopListener);

  (async () => {
    const startTime = Date.now();
    for (let i = startIndex; i < phrases.length; i++) {
      if (stopped) break;
      const url = searchUrls[searchEngine] + encodeURIComponent(phrases[i]);
      chrome.tabs.update(tabId, { url });
      if (i < phrases.length - 1) {
        const delay = 8000 + Math.random() * 7000; // 8-15 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      // Send completed message with timestamp
      chrome.runtime.sendMessage({
        action: 'completed',
        phrase: phrases[i],
        time: new Date().toLocaleString()
      });
    }
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    chrome.runtime.sendMessage({
      action: 'finished',
      totalTime
    });
  })();
}
