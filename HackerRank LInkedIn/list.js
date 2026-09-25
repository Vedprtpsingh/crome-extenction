class LinkedInManager {
  constructor() {
    this.elements = this.initializeElements();
    this.state = { linkedInLinks: [], openedDeletedLinks: [], duplicateLinks: [] };
    this.init();
  }

  initializeElements() {
    return {
      list: document.getElementById('linkedin-list'),
      openedDeletedList: document.getElementById('opened-deleted-list'),
      duplicateLinksList: document.getElementById('duplicate-links-list'),
      scannedCount: document.getElementById('scanned-count'),
      duplicateCount: document.getElementById('duplicate-count'),
      openedDeletedCount: document.getElementById('opened-deleted-count'),
      clearDuplicateLinksBtn: document.getElementById('clear-duplicate-links-btn'),
      openAllBtn: document.getElementById('open-all-btn'),
      openTop5Btn: document.getElementById('open-top5-btn'),
      copyAllBtn: document.getElementById('copy-all-btn'),
      pasteBtn: document.getElementById('paste-btn'),
      pasteModal: document.getElementById('paste-modal'),
      pasteTextarea: document.getElementById('paste-textarea'),
      pasteCancelBtn: document.getElementById('paste-cancel-btn'),
      pasteAddBtn: document.getElementById('paste-add-btn')
    };
  }

  async init() {
    try {
      console.log('Initializing LinkedInManager...');
      await this.loadData();
      this.bindEvents();
      this.renderAllLists();
      this.startRealTimeUpdates();
      this.debugElements(); // Add debug function
      console.log('LinkedInManager initialized successfully');
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showError('Failed to load data');
    }
  }

  debugElements() {
    console.log('=== DEBUG: Element Check ===');
    Object.entries(this.elements).forEach(([key, element]) => {
      if (element) {
        console.log(`✓ ${key}: Found`);
      } else {
        console.error(`✗ ${key}: NOT FOUND`);
      }
    });
    console.log('=== END DEBUG ===');
  }

  startRealTimeUpdates() {
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
      let shouldUpdate = false;
      let newLinks = [];
      
      if (changes.linkedInLinks) {
        const oldLinks = this.state.linkedInLinks || [];
        const newLinksArray = changes.linkedInLinks.newValue || [];
        newLinks = newLinksArray.filter(link => !oldLinks.includes(link));
        this.state.linkedInLinks = newLinksArray;
        shouldUpdate = true;
      }
      if (changes.openedDeletedLinks) {
        this.state.openedDeletedLinks = changes.openedDeletedLinks.newValue || [];
        shouldUpdate = true;
      }
      if (changes.duplicateLinks) {
        this.state.duplicateLinks = changes.duplicateLinks.newValue || [];
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        this.renderAllLists();
        this.updateLastUpdated();
        
        // Highlight new links
        if (newLinks.length > 0) {
          setTimeout(() => this.highlightNewLinks(newLinks), 100);
        }
      }
    });
    
    // Listen for scan progress
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'scanProgress') {
        this.updateScanProgress(message);
      }
    });
    
    // Refresh data every 2 seconds
    setInterval(() => {
      this.loadData().then(() => {
        this.renderAllLists();
        this.updateLastUpdated();
      });
    }, 2000);
  }

  updateScanProgress(progress) {
    const statusEl = document.querySelector('.scan-status');
    if (!statusEl) {
      const statsBar = document.querySelector('.stats-bar');
      const scanStatus = document.createElement('div');
      scanStatus.className = 'scan-status';
      scanStatus.style.cssText = 'background: #e3f2fd; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-weight: 600; color: #1976d2; text-align: center;';
      statsBar.parentNode.insertBefore(scanStatus, statsBar.nextSibling);
    }
    
    const statusEl2 = document.querySelector('.scan-status');
    const currentCount = this.getAvailableLinks().length;
    
    if (progress.status === 'scanning') {
      statusEl2.innerHTML = `🔄 Scanning HackerRank Page ${progress.page}... <br>LinkedIn Profiles Found: ${currentCount}`;
    } else if (progress.status === 'complete') {
      statusEl2.innerHTML = `✅ Scan Complete! Total LinkedIn Profiles: ${currentCount}`;
      setTimeout(() => statusEl2.remove(), 10000);
    }
  }



  highlightNewLinks(newLinks) {
    const allLinks = this.elements.list.querySelectorAll('a');
    allLinks.forEach(linkEl => {
      if (newLinks.includes(linkEl.href)) {
        const li = linkEl.closest('li');
        li.style.cssText = 'background: #e8f5e8 !important; animation: fadeIn 0.5s ease-in;';
        setTimeout(() => {
          li.style.background = '';
        }, 3000);
      }
    });
  }

  updateLastUpdated() {
    const timeEl = document.querySelector('.last-updated');
    if (!timeEl) {
      const container = document.querySelector('.container');
      const lastUpdated = document.createElement('div');
      lastUpdated.className = 'last-updated';
      lastUpdated.style.cssText = 'text-align: center; color: #666; font-size: 12px; margin-top: 10px;';
      container.appendChild(lastUpdated);
    }
    
    const timeEl2 = document.querySelector('.last-updated');
    timeEl2.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }

  async loadData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['linkedInLinks', 'openedDeletedLinks', 'duplicateLinks'], (result) => {
        this.state = {
          linkedInLinks: result.linkedInLinks || [],
          openedDeletedLinks: result.openedDeletedLinks || [],
          duplicateLinks: result.duplicateLinks || []
        };
        resolve();
      });
    });
  }

  async saveData(updates) {
    return new Promise((resolve) => {
      chrome.storage.local.set(updates, resolve);
    });
  }

  bindEvents() {
    this.elements.clearDuplicateLinksBtn?.addEventListener('click', () => this.clearDuplicates());
    this.elements.openAllBtn?.addEventListener('click', () => this.openAllLinks());
    this.elements.openTop5Btn?.addEventListener('click', () => this.openTopLinks(4));
    this.elements.copyAllBtn?.addEventListener('click', () => this.copyAllLinks());
    
    // Enhanced paste button event binding with error handling
    if (this.elements.pasteBtn) {
      this.elements.pasteBtn.addEventListener('click', (e) => {
        console.log('Paste button clicked');
        try {
          this.openPasteModal();
        } catch (error) {
          console.error('Error opening paste modal:', error);
          alert('Error opening paste dialog. Please try again.');
        }
      });
    } else {
      console.error('Paste button not found!');
    }
    
    if (this.elements.pasteCancelBtn) {
      this.elements.pasteCancelBtn.addEventListener('click', () => this.closePasteModal());
    }
    
    if (this.elements.pasteAddBtn) {
      this.elements.pasteAddBtn.addEventListener('click', () => this.addPastedLinks());
    }
    
    // Add keyboard shortcut for paste modal
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'v' && e.altKey) {
        e.preventDefault();
        this.openPasteModal();
      }
      if (e.key === 'Escape' && this.elements.pasteModal.style.display === 'flex') {
        this.closePasteModal();
      }
    });
    
    // Click outside modal to close
    this.elements.pasteModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.pasteModal) {
        this.closePasteModal();
      }
    });
  }

  createLinkElement(link, index, actions = []) {
    const li = document.createElement('li');
    
    const serialSpan = document.createElement('span');
    serialSpan.className = 'link-number';
    serialSpan.textContent = `${index + 1}.`;
    
    const a = document.createElement('a');
    a.className = 'link-url';
    a.href = link;
    a.target = '_blank';
    a.textContent = this.sanitizeText(link);
    a.addEventListener('click', (e) => this.handleLinkClick(e, link));
    
    li.appendChild(serialSpan);
    li.appendChild(a);
    
    if (actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'link-actions';
      
      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'btn-small btn-delete';
        btn.textContent = action.text;
        btn.addEventListener('click', (e) => action.handler(e, link, index));
        actionsDiv.appendChild(btn);
      });
      
      li.appendChild(actionsDiv);
    }
    
    return li;
  }

  async handleLinkClick(event, link) {
    event.preventDefault();
    window.open(link, '_blank');
    await this.moveToOpened(link);
  }

  async moveToOpened(link) {
    if (!this.state.openedDeletedLinks.includes(link)) {
      this.state.openedDeletedLinks.push(link);
      this.state.linkedInLinks = this.state.linkedInLinks.filter(l => l !== link);
      
      await this.saveData({
        linkedInLinks: this.state.linkedInLinks,
        openedDeletedLinks: this.state.openedDeletedLinks
      });
      
      this.renderAllLists();
    }
  }

  async deleteFromOpened(link, index) {
    this.state.openedDeletedLinks.splice(index, 1);
    await this.saveData({ openedDeletedLinks: this.state.openedDeletedLinks });
    this.renderAllLists();
  }

  getAvailableLinks() {
    const openedSet = new Set(this.state.openedDeletedLinks);
    const duplicateSet = new Set(this.state.duplicateLinks);
    return this.state.linkedInLinks.filter(link => 
      !openedSet.has(link) && !duplicateSet.has(link)
    );
  }

  renderList(links) {
    const openedSet = new Set(this.state.openedDeletedLinks);
    const duplicateSet = new Set(this.state.duplicateLinks);
    const filteredLinks = links.filter(link => 
      !openedSet.has(link) && !duplicateSet.has(link)
    );
    
    this.elements.scannedCount.textContent = filteredLinks.length;
    this.elements.list.innerHTML = '';
    
    if (filteredLinks.length === 0) {
      this.elements.list.textContent = 'No LinkedIn profiles found.';
      return;
    }
    
    const fragment = document.createDocumentFragment();
    filteredLinks.forEach((link, index) => {
      const li = this.createLinkElement(link, index, [
        { text: 'Delete', handler: (e, link) => { e.preventDefault(); this.moveToOpened(link); } }
      ]);
      fragment.appendChild(li);
    });
    
    this.elements.list.appendChild(fragment);
  }

  renderOpenedDeletedList() {
    this.elements.openedDeletedCount.textContent = this.state.openedDeletedLinks.length;
    this.elements.openedDeletedList.innerHTML = '';
    
    if (this.state.openedDeletedLinks.length === 0) {
      this.elements.openedDeletedList.textContent = 'No opened or deleted links yet.';
      return;
    }
    
    const fragment = document.createDocumentFragment();
    this.state.openedDeletedLinks.forEach((link, index) => {
      const li = this.createLinkElement(link, index, [
        { text: 'Delete', handler: (e, link, idx) => { e.preventDefault(); this.deleteFromOpened(link, idx); } }
      ]);
      fragment.appendChild(li);
    });
    
    this.elements.openedDeletedList.appendChild(fragment);
  }

  renderDuplicateList() {
    this.elements.duplicateCount.textContent = this.state.duplicateLinks.length;
    this.elements.duplicateLinksList.innerHTML = '';
    
    if (this.state.duplicateLinks.length === 0) {
      this.elements.duplicateLinksList.textContent = 'No duplicate links yet.';
      return;
    }
    
    const fragment = document.createDocumentFragment();
    this.state.duplicateLinks.forEach((link, index) => {
      const li = this.createLinkElement(link, index);
      fragment.appendChild(li);
    });
    
    this.elements.duplicateLinksList.appendChild(fragment);
  }

  renderAllLists() {
    this.renderList(this.state.linkedInLinks);
    this.renderOpenedDeletedList();
    this.renderDuplicateList();
  }

  async clearDuplicates() {
    this.state.linkedInLinks = this.state.linkedInLinks.filter(link => !this.state.duplicateLinks.includes(link));
    this.state.duplicateLinks = [];
    
    await this.saveData({
      linkedInLinks: this.state.linkedInLinks,
      duplicateLinks: this.state.duplicateLinks
    });
    
    this.renderAllLists();
  }

  openAllLinks() {
    const availableLinks = this.getAvailableLinks();
    
    if (availableLinks.length === 0) {
      alert('No links available to open.');
      return;
    }
    
    if (availableLinks.length > 10) {
      if (!confirm(`This will open ${availableLinks.length} tabs. Continue?`)) return;
    }
    
    availableLinks.forEach((link, index) => {
      setTimeout(() => window.open(link, '_blank'), index * 100);
    });
  }

  async openTopLinks(count = 4) {
    const availableLinks = this.getAvailableLinks();
    
    const topLinks = availableLinks.slice(0, count);
    
    if (topLinks.length === 0) {
      alert('No links available to open.');
      return;
    }
    
    // Add to opened list immediately
    topLinks.forEach(link => {
      if (!this.state.openedDeletedLinks.includes(link)) {
        this.state.openedDeletedLinks.push(link);
      }
    });
    
    // Remove from main list
    this.state.linkedInLinks = this.state.linkedInLinks.filter(link => !topLinks.includes(link));
    
    // Open links with delay
    topLinks.forEach((link, index) => {
      setTimeout(() => window.open(link, '_blank'), index * 100);
    });
    
    await this.saveData({
      linkedInLinks: this.state.linkedInLinks,
      openedDeletedLinks: this.state.openedDeletedLinks
    });
    
    this.renderAllLists();
  }

  async copyAllLinks() {
    const availableLinks = this.getAvailableLinks();
    
    if (availableLinks.length === 0) {
      alert('No links available to copy.');
      return;
    }
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(availableLinks.join('\n'));
        alert(`Copied ${availableLinks.length} links to clipboard!`);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = availableLinks.join('\n');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`Copied ${availableLinks.length} links to clipboard!`);
      }
    } catch (error) {
      console.error('Failed to copy links:', error);
      alert('Failed to copy links to clipboard.');
    }
  }

  showError(message) {
    const li = document.createElement('li');
    li.style.color = 'red';
    li.textContent = `Error: ${message}`;
    this.elements.list.innerHTML = '';
    this.elements.list.appendChild(li);
  }

  sanitizeText(text) {
    return text.replace(/[<>"'&]/g, (match) => {
      const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
      return map[match];
    });
  }

  openPasteModal() {
    console.log('Opening paste modal...');
    
    if (!this.elements.pasteModal) {
      console.error('Paste modal element not found!');
      alert('Paste dialog not available. Please refresh the page.');
      return;
    }
    
    try {
      this.elements.pasteModal.style.display = 'flex';
      
      if (this.elements.pasteTextarea) {
        this.elements.pasteTextarea.value = '';
        // Small delay to ensure modal is visible before focusing
        setTimeout(() => {
          this.elements.pasteTextarea.focus();
        }, 100);
      }
      
      console.log('Paste modal opened successfully');
    } catch (error) {
      console.error('Error in openPasteModal:', error);
      alert('Error opening paste dialog: ' + error.message);
    }
  }

  closePasteModal() {
    this.elements.pasteModal.style.display = 'none';
  }

  extractLinkedInUrls(text) {
    const regex = /(?:https?:\/\/)?(?:www\.|in\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/gi;
    const matches = text.match(regex) || [];
    return [...new Set(matches.map(url => {
      let cleanUrl = decodeURIComponent(url).replace(/["'}]+$/, '');
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      return cleanUrl.replace(/^https?:\/\/in\.linkedin/, 'https://www.linkedin');
    }))];
  }

  async addPastedLinks() {
    console.log('Adding pasted links...');
    
    if (!this.elements.pasteTextarea) {
      console.error('Paste textarea not found!');
      alert('Error: Paste input not available.');
      return;
    }
    
    const text = this.elements.pasteTextarea.value.trim();
    console.log('Pasted text:', text);
    
    if (!text) {
      alert('Please paste some LinkedIn URLs.');
      return;
    }

    try {
      const extractedLinks = this.extractLinkedInUrls(text);
      console.log('Extracted links:', extractedLinks);
      
      if (extractedLinks.length === 0) {
        alert('No valid LinkedIn profile URLs found. Please make sure you\'re pasting LinkedIn profile URLs like:\nhttps://www.linkedin.com/in/username');
        return;
      }

      const openedSet = new Set(this.state.openedDeletedLinks);
      const existingSet = new Set(this.state.linkedInLinks);
      const duplicateSet = new Set(this.state.duplicateLinks);
      
      const newLinks = [];
      const duplicates = [];
      
      extractedLinks.forEach(link => {
        if (openedSet.has(link)) {
          duplicates.push(link);
          if (!duplicateSet.has(link)) {
            duplicateSet.add(link);
          }
        } else if (!existingSet.has(link)) {
          newLinks.push(link);
          existingSet.add(link);
        }
      });

      console.log('New links to add:', newLinks);
      console.log('Duplicate links found:', duplicates);

      this.state.linkedInLinks = Array.from(existingSet);
      this.state.duplicateLinks = Array.from(duplicateSet);
      
      await this.saveData({
        linkedInLinks: this.state.linkedInLinks,
        duplicateLinks: this.state.duplicateLinks
      });
      
      this.renderAllLists();
      this.closePasteModal();
      
      let message = `Successfully added ${newLinks.length} new link(s).`;
      if (duplicates.length > 0) {
        message += `\n${duplicates.length} duplicate(s) found (already opened/deleted).`;
      }
      
      console.log('Operation completed:', message);
      alert(message);
      
    } catch (error) {
      console.error('Error in addPastedLinks:', error);
      alert('Error processing pasted links: ' + error.message);
    }
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new LinkedInManager();
});