document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('linkedin-list');
  const openAllBtn = document.getElementById('open-all-btn');
  list.innerHTML = '<li>Loading...</li>';

  chrome.runtime.sendMessage({action: 'getLinkedInLinks'}, response => {
    list.innerHTML = '';
    if (response.linkedInLinks && response.linkedInLinks.length > 0) {
      response.linkedInLinks.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.textContent = link;
        li.appendChild(a);
        list.appendChild(li);
      });
    } else {
      list.innerHTML = '<li>No LinkedIn profiles found yet.</li>';
    }
  });

  openAllBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({action: 'getLinkedInLinks'}, response => {
      if (response.linkedInLinks && response.linkedInLinks.length > 0) {
        const url = chrome.runtime.getURL('list.html');
        // Always open in new tab
        chrome.tabs.create({ url, active: true });
      } else {
        alert('No LinkedIn profiles found to open.');
      }
    });
  });
});
