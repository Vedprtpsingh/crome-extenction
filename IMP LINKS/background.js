
chrome.commands.onCommand.addListener((command) => {
  if (command === "add_current_page") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length === 0) return;
      const tab = tabs[0];
      const url = tab.url;
      const title = tab.title || url;

      chrome.storage.local.get({ sections: [] }, (data) => {
        let sections = data.sections;

        // Find or create "New ADDED" section
        let newAddedSection = sections.find(s => s.name === "New ADDED");
        if (!newAddedSection) {
          newAddedSection = {
            id: Date.now().toString(),
            name: "New ADDED",
            links: []
          };
          sections.push(newAddedSection);
        }

        // Check if link already exists in the section
        const exists = newAddedSection.links.some(link => link.url === url);
        if (!exists) {
          newAddedSection.links.push({
            id: Date.now().toString(),
            title: title,
            url: url,
            visited: false,
            visitedTimestamp: null,
            addedTimestamp: Date.now()
          });
        }

        chrome.storage.local.set({ sections: sections });
      });
    });
  }
});

// Listen for tab updates to mark links as visited and store timestamp
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get({ sections: [] }, (data) => {
      let sections = data.sections;
      let updated = false;

      sections.forEach(section => {
        section.links.forEach(link => {
          if (link.url === tab.url && !link.visited) {
            link.visited = true;
            link.visitedTimestamp = Date.now();
            updated = true;
          }
        });
      });

      if (updated) {
        chrome.storage.local.set({ sections: sections });
      }
    });
  }
});

// Open newtab.html in a new tab when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'newtab.html' });
});
