function extractProfileLinks() {
  const profileLinks = new Set();
  // The leaderboard page has user profile links in elements with class 'username' or similar
  // Let's find all anchor tags that link to user profiles
  const anchors = document.querySelectorAll('a[href^="/profile/"]');
  anchors.forEach(anchor => {
    const href = anchor.href || (window.location.origin + anchor.getAttribute('href'));
    if (href) {
      profileLinks.add(href);
    }
  });
  return Array.from(profileLinks);
}

function sendProfilesToBackground(profiles) {
  chrome.runtime.sendMessage({action: 'addProfiles', profiles}, response => {
    console.log('Profiles sent to background:', response);
  });
}

// Run extraction and send profiles
const profiles = extractProfileLinks();
if (profiles.length > 0) {
  sendProfilesToBackground(profiles);
} else {
  console.log('No profile links found on this leaderboard page.');
}
