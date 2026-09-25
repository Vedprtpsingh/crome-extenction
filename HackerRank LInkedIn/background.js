class BackgroundManager {
  constructor() {
    this.profileQueue = [];
    this.isProcessing = false;
    this.progressWindowId = null;
    this.cleanupTimeoutId = null;
    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'scanProgress') {
        this.updateProgress(message.page || 0, message.totalProfiles || 0, message.username || '');
        return;
      }
      
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
    
    chrome.action.onClicked.addListener(() => {
      const url = chrome.runtime.getURL('list.html');
      chrome.tabs.create({ url, active: true });
    });
    
    chrome.runtime.onStartup.addListener(() => this.cleanupOnStartup());
  }

  handleMessage(message, sender, sendResponse) {
    (async () => {
      try {
        switch (message.action) {
          case 'addProfiles':
            await this.addProfiles(message.profiles);
            sendResponse({ status: 'Profiles added' });
            break;
          case 'getLinkedInLinks':
            const data = await this.getStoredData();
            sendResponse(data);
            break;
          default:
            sendResponse({ error: 'Unknown action' });
        }
      } catch (error) {
        console.error('Message handling error:', error);
        sendResponse({ error: error.message });
      }
    })();
  }

  async addProfiles(profiles) {
    // Remove duplicates from incoming profiles
    const uniqueProfiles = [...new Set(profiles)];
    
    // Filter out profiles already in queue
    const newProfiles = uniqueProfiles.filter(profile => 
      !this.profileQueue.includes(profile)
    );
    
    if (newProfiles.length === 0) {
      console.log('No new profiles to add');
      return;
    }
    
    this.profileQueue.push(...newProfiles);
    console.log(`Added ${newProfiles.length} new profiles to queue`);
    
    if (!this.isProcessing) {
      await this.openProgressWindow();
      await this.processQueue();
    }
  }

  async getStoredData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['linkedInLinks', 'openedDeletedLinks', 'duplicateLinks'], (result) => {
        resolve({
          linkedInLinks: result.linkedInLinks || [],
          openedDeletedLinks: result.openedDeletedLinks || [],
          duplicateLinks: result.duplicateLinks || []
        });
      });
    });
  }

  async openProgressWindow() {
    const url = chrome.runtime.getURL('progress.html');
    const { progressWindowSize } = await new Promise(resolve => 
      chrome.storage.local.get(['progressWindowSize'], resolve)
    );
    
    return new Promise((resolve) => {
      chrome.windows.create({
        url,
        type: 'popup',
        width: progressWindowSize?.width || 280,
        height: progressWindowSize?.height || 120,
        focused: true
      }, (window) => {
        this.progressWindowId = window.id;
        resolve(window);
      });
    });
  }

  updateProgress(current, total, username) {
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      current,
      total,
      username
    });
  }

  async processQueue() {
    this.isProcessing = true;
    const total = this.profileQueue.length;
    let count = 0;

    console.log(`Starting to process ${total} profiles...`);

    const { linkedInLinks = [], openedDeletedLinks = [], duplicateLinks = [] } = await this.getStoredData();
    const storedLinks = new Set(linkedInLinks);
    const openedSet = new Set(openedDeletedLinks);
    const duplicateSet = new Set(duplicateLinks);

    while (this.profileQueue.length > 0) {
      const profileUrl = this.profileQueue.shift();
      count++;
      const username = profileUrl.split('/').pop() || `Profile ${count}`;
      this.updateProgress(count, total, username);

      console.log(`Processing profile ${count}/${total}: ${username}`);

      try {
        await this.delay(100);
        const response = await fetch(profileUrl);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const text = await response.text();
        const regex = /(?:https?:\/\/)?(?:www\.|in\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/gi;
        const matches = text.match(regex);
        
        if (matches?.length > 0) {
          console.log(`Found ${matches.length} LinkedIn links in ${username}`);
          
          for (const link of matches) {
            let cleanLink = decodeURIComponent(link).replace(/["'}]+$/, '');
            if (!cleanLink.startsWith('http')) {
              cleanLink = 'https://' + cleanLink;
            }
            cleanLink = cleanLink.replace(/^https?:\/\/in\./, 'https://www.');
            
            if (openedSet.has(cleanLink)) {
              duplicateSet.add(cleanLink);
            } else if (!storedLinks.has(cleanLink)) {
              storedLinks.add(cleanLink);
              // Update storage immediately for live display
              await this.saveData({ linkedInLinks: Array.from(storedLinks) });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${profileUrl}:`, error);
      }
    }

    await this.finishProcessing(storedLinks, duplicateSet);
  }

  async finishProcessing(storedLinks, duplicateSet) {
    this.isProcessing = false;
    
    if (this.progressWindowId) {
      // Save window size before closing
      chrome.windows.get(this.progressWindowId, (window) => {
        if (window) {
          chrome.storage.local.set({
            progressWindowSize: { width: window.width, height: window.height }
          });
        }
      });
      
      chrome.windows.remove(this.progressWindowId);
      this.progressWindowId = null;
    }

    const finalData = {
      linkedInLinks: Array.from(storedLinks),
      duplicateLinks: Array.from(duplicateSet)
    };

    if (finalData.duplicateLinks.length > 0) {
      finalData.duplicateTimerStart = Date.now();
      this.scheduleCleanup();
    }

    await this.saveData(finalData);
  }

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



  scheduleCleanup() {
    if (this.cleanupTimeoutId) {
      clearTimeout(this.cleanupTimeoutId);
    }
    
    this.cleanupTimeoutId = setTimeout(async () => {
      try {
        await this.saveData({ 
          duplicateLinks: [],
          duplicateTimerStart: null 
        });
        console.log('Duplicate links auto-deleted after 5 minutes');
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }, 5 * 60 * 1000);
  }

  async cleanupOnStartup() {
    const { duplicateLinks = [], duplicateTimerStart } = await this.getStoredData();
    
    if (duplicateLinks.length > 0 && duplicateTimerStart) {
      const elapsed = Date.now() - duplicateTimerStart;
      const remaining = (5 * 60 * 1000) - elapsed;
      
      if (remaining <= 0) {
        await this.saveData({ 
          duplicateLinks: [],
          duplicateTimerStart: null 
        });
      } else {
        setTimeout(async () => {
          await this.saveData({ 
            duplicateLinks: [],
            duplicateTimerStart: null 
          });
        }, remaining);
      }
    }
  }
}

// Initialize the background manager
new BackgroundManager();