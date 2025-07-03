chrome.runtime.sendMessage({action: 'requestLinkedInLink'}, (response) => {
  if (response && response.action === 'sendLinkedInLink') {
    // Already received LinkedIn link, no need to parse again
    return;
  }
});

// Parse LinkedIn link from profile page
function extractLinkedInLink() {
  const linkedInAnchor = document.querySelector('a[href*="linkedin.com/in/"]');
  if (linkedInAnchor) {
    return linkedInAnchor.href;
  }
  return null;
}

const linkedInLink = extractLinkedInLink();
if (linkedInLink) {
  chrome.runtime.sendMessage({action: 'sendLinkedInLink', link: linkedInLink});
}
