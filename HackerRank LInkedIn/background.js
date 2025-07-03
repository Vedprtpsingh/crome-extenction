const linkedInLinks = new Set();
const profileQueue = [];
let isProcessing = false;
let progressWindowId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'addProfiles') {
    profileQueue.push(...message.profiles);
    if (!isProcessing) {
      openProgressWindow();
      processQueue();
    }
    sendResponse({status: 'Profiles added'});
  } else if (message.action === 'getLinkedInLinks') {
    sendResponse({linkedInLinks: Array.from(linkedInLinks)});
  }
  return true; // keep the message channel open for async response
});

function openProgressWindow() {
  const url = chrome.runtime.getURL('progress.html');
  chrome.windows.create({
    url,
    type: 'popup',
    width: 270,
    height: 120,
    focused: true
  }, (window) => {
    progressWindowId = window.id;
  });
}

function updateProgress(current, total, username) {
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    current,
    total,
    username
  });
}

function processQueue() {
  isProcessing = true;
  const total = profileQueue.length;
  let count = 0;

  // Fetch existing links from storage
  chrome.storage.local.get(['linkedInLinks', 'openedDeletedLinks', 'duplicateLinks'], (result) => {
    const storedLinks = new Set(result.linkedInLinks || []);
    const openedDeletedLinks = new Set(result.openedDeletedLinks || []);
    const duplicateLinks = new Set(result.duplicateLinks || []);

    function processNext() {
      if (profileQueue.length === 0) {
        isProcessing = false;
        if (progressWindowId !== null) {
          chrome.windows.remove(progressWindowId);
          progressWindowId = null;
        }
        // Save all links to chrome.storage for persistence
        chrome.storage.local.set({
          linkedInLinks: Array.from(storedLinks),
          duplicateLinks: Array.from(duplicateLinks)
        }, () => {
          const url = chrome.runtime.getURL('list.html');
          chrome.tabs.create({ url, active: true });
        });
        return;
      }

      const profileUrl = profileQueue.shift();
      count++;
      const username = profileUrl.split('/').pop();
      updateProgress(count, total, username);

      fetch(profileUrl).then(response => response.text()).then(text => {
        const regex = /https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/g;
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
          matches.forEach(link => {
            let cleanLink = decodeURIComponent(link);
            cleanLink = cleanLink.replace(/["'}]+$/, '');

            // Check for duplicates
            if (storedLinks.has(cleanLink) || openedDeletedLinks.has(cleanLink)) {
              duplicateLinks.add(cleanLink);
            } else {
              storedLinks.add(cleanLink);
            }
          });
        }
        processNext();
      }).catch(error => {
        console.error('Error fetching profile:', profileUrl, error);
        processNext();
      });
    }

    processNext();
  });
}
