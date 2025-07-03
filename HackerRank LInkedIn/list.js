document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('linkedin-list');
  const openTop5Btn = document.getElementById('open-top5-btn');
  const copyAllBtn = document.getElementById('copy-all-btn');
  const openedDeletedList = document.getElementById('opened-deleted-list');
  const duplicateLinksList = document.getElementById('duplicate-links-list');
  const scannedCount = document.getElementById('scanned-count');
  const duplicateCount = document.getElementById('duplicate-count');
  const openedDeletedCount = document.getElementById('opened-deleted-count');

  let openedDeletedLinks = [];
  let duplicateLinks = [];

  function renderList(links) {
    list.innerHTML = '';
    scannedCount.textContent = links.length;
    if (links.length > 0) {
      links.forEach((link, index) => {
        const li = document.createElement('li');

        const serialSpan = document.createElement('span');
        serialSpan.textContent = (index + 1) + '. ';
        serialSpan.style.marginRight = '8px';

        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.textContent = link;
        a.addEventListener('click', (event) => {
          event.stopPropagation();
          event.preventDefault();
          window.open(a.href, '_blank');
          // Move the link from the main list to the opened/deleted list
          chrome.storage.local.get(['linkedInLinks', 'openedDeletedLinks', 'duplicateLinks'], (result) => {
            let storedLinks = result.linkedInLinks || [];
            let opened = result.openedDeletedLinks || [];
            let duplicates = result.duplicateLinks || [];

            if (!opened.includes(link)) {
              opened.push(link);
            }
            const remainingLinks = storedLinks.filter(l => l !== link);

            chrome.storage.local.set({ linkedInLinks: remainingLinks, openedDeletedLinks: opened }, () => {
              // Update local state and re-render all lists
              openedDeletedLinks = opened;
              duplicateLinks = duplicates;
              renderList(remainingLinks.filter(l => !opened.includes(l) && !duplicates.includes(l)));
              renderOpenedDeletedList();
              renderDuplicateList();
            });
          });
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          event.preventDefault();
          // Move the link from the main list to the opened/deleted list
          chrome.storage.local.get(['linkedInLinks', 'openedDeletedLinks', 'duplicateLinks'], (result) => {
            let storedLinks = result.linkedInLinks || [];
            let opened = result.openedDeletedLinks || [];
            let duplicates = result.duplicateLinks || [];

            if (!opened.includes(link)) {
              opened.push(link);
            }
            const remainingLinks = storedLinks.filter(l => l !== link);

            chrome.storage.local.set({ linkedInLinks: remainingLinks, openedDeletedLinks: opened }, () => {
              // Update local state and re-render all lists
              openedDeletedLinks = opened;
              duplicateLinks = duplicates;
              renderList(remainingLinks.filter(l => !opened.includes(l) && !duplicates.includes(l)));
              renderOpenedDeletedList();
              renderDuplicateList();
            });
          });
        });

        li.appendChild(serialSpan);
        li.appendChild(a);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
    } else {
      list.textContent = 'No LinkedIn profiles found.';
    }
  }

  function renderOpenedDeletedList() {
    openedDeletedList.innerHTML = '';
    openedDeletedCount.textContent = openedDeletedLinks.length;
    if (openedDeletedLinks.length > 0) {
      openedDeletedLinks.forEach((link, index) => {
        const li = document.createElement('li');

        const serialSpan = document.createElement('span');
        serialSpan.textContent = (index + 1) + '. ';
        serialSpan.style.marginRight = '8px';

        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.textContent = link;
        a.addEventListener('click', (event) => {
          event.stopPropagation();
          event.preventDefault();
          window.open(a.href, '_blank');
          // Move the link to the end of the list to mark it as recently opened
          const updatedOpenedDeletedLinks = openedDeletedLinks.filter(l => l !== link);
          updatedOpenedDeletedLinks.push(link);
          chrome.storage.local.set({ openedDeletedLinks: updatedOpenedDeletedLinks }, () => {
            openedDeletedLinks = updatedOpenedDeletedLinks;
            renderOpenedDeletedList();
          });
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          event.preventDefault();
          openedDeletedLinks.splice(index, 1);
          chrome.storage.local.set({ openedDeletedLinks }, () => {
            renderOpenedDeletedList();
          });
        });

        li.appendChild(serialSpan);
        li.appendChild(a);
        li.appendChild(deleteBtn);
        openedDeletedList.appendChild(li);
      });
    } else {
      openedDeletedList.textContent = 'No opened or deleted links yet.';
    }
  }

  function renderDuplicateList() {
    duplicateLinksList.innerHTML = '';
    duplicateCount.textContent = duplicateLinks.length;
    if (duplicateLinks.length > 0) {
      duplicateLinks.forEach((link, index) => {
        const li = document.createElement('li');

        const serialSpan = document.createElement('span');
        serialSpan.textContent = (index + 1) + '. ';
        serialSpan.style.marginRight = '8px';

        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.textContent = link;

        li.appendChild(serialSpan);
        li.appendChild(a);
        duplicateLinksList.appendChild(li);
      });
    } else {
      duplicateLinksList.textContent = 'No duplicate links yet.';
    }
  }

  chrome.storage.local.get(['linkedInLinks', 'openedDeletedLinks', 'duplicateLinks'], (result) => {
    let storedLinks = result.linkedInLinks || [];
    openedDeletedLinks = result.openedDeletedLinks || [];
    duplicateLinks = result.duplicateLinks || [];

    // Filter out openedDeletedLinks from display list only
    // Filter out opened/deleted and duplicate links from the main list
    const displayLinks = storedLinks.filter(link => !openedDeletedLinks.includes(link) && !duplicateLinks.includes(link));

    // Just render the lists
    renderList(displayLinks);
    renderOpenedDeletedList();
    renderDuplicateList();
  });


  openTop5Btn.addEventListener('click', () => {
    chrome.storage.local.get(['linkedInLinks', 'openedDeletedLinks', 'duplicateLinks'], (result) => {
      let links = result.linkedInLinks || [];
      let openedDeleted = result.openedDeletedLinks || [];
      let duplicates = result.duplicateLinks || [];
      
      // Filter out duplicates before selecting the top 4
      const filteredLinks = links.filter(link => !duplicates.includes(link));
      const top4 = filteredLinks.slice(0, 4);

      top4.forEach(link => {
        window.open(link, '_blank');
        if (!openedDeleted.includes(link)) {
          openedDeleted.push(link);
        }
      });

      // Remove the opened links from the main list
      const remainingLinks = links.filter(link => !top4.includes(link));
      
      chrome.storage.local.set({ linkedInLinks: remainingLinks, openedDeletedLinks: openedDeleted }, () => {
        // Re-render all lists to reflect the changes
        renderList(remainingLinks.filter(link => !openedDeleted.includes(link) && !duplicates.includes(link)));
        renderOpenedDeletedList();
        renderDuplicateList();
      });
    });
  });

  copyAllBtn.addEventListener('click', () => {
    chrome.storage.local.get(['linkedInLinks', 'openedDeletedLinks', 'duplicateLinks'], (result) => {
      const links = result.linkedInLinks || [];
      const openedDeleted = result.openedDeletedLinks || [];
      const duplicates = result.duplicateLinks || [];
      const filteredLinks = links.filter(link => !openedDeleted.includes(link) && !duplicates.includes(link));

      if (filteredLinks.length > 0) {
        const textToCopy = filteredLinks.join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
          alert('Visible LinkedIn links copied to clipboard!');
        }).catch(err => {
          alert('Failed to copy links: ' + err);
        });
      } else {
        alert('No LinkedIn links to copy.');
      }
    });
  });
});
