class LeaderboardExtractor {
  constructor() {
    this.init();
  }

  init() {
    // Wait for page to load completely
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.extract());
    } else {
      this.extract();
    }
  }

  extractProfileLinks() {
    return this.extractProfileLinksFromDoc(document);
  }

  normalizeUrl(url) {
    if (!url) return null;
    
    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        return window.location.origin + url;
      }
      
      // Validate and return absolute URLs
      const urlObj = new URL(url);
      return urlObj.href;
    } catch (error) {
      console.warn('Invalid URL:', url, error);
      return null;
    }
  }

  isValidProfileUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'www.hackerrank.com' && 
             urlObj.pathname.includes('/profile/');
    } catch {
      return false;
    }
  }

  async sendProfilesToBackground(profiles) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'addProfiles', profiles }, 
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            console.log('Profiles sent to background:', response);
            resolve(response);
          }
        }
      );
    });
  }

  async extract() {
    try {
      console.log('Starting HackerRank leaderboard scan...');
      
      // Get current page from URL or default to 1
      const url = new URL(window.location.href);
      const currentPageParam = url.searchParams.get('page');
      const startPage = currentPageParam ? parseInt(currentPageParam, 10) : 1;
      
      await this.scanAllPages(startPage, 1000);
      
    } catch (error) {
      console.error('Extraction failed:', error);
    }
  }
  
  getBaseUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    return url.toString();
  }
  
  async scanAllPages(startPage = 1, endPage = 1000) {
    let currentPage = startPage;
    let hasMorePages = true;
    
    while (hasMorePages && currentPage <= endPage) {
      console.log(`Scanning page ${currentPage}...`);
      
      // Update progress
      chrome.runtime.sendMessage({
        action: 'scanProgress',
        page: currentPage,
        status: 'scanning'
      });
      
      try {
        const pageProfiles = await this.scanPage(currentPage);
        
        if (pageProfiles.length === 0) {
          hasMorePages = false;
        } else {
          // Send profiles from this page immediately
          await this.sendProfilesToBackground(pageProfiles);
          
          currentPage++;
          await this.delay(1000); // Delay between pages
        }
      } catch (error) {
        console.error(`Failed to scan page ${currentPage}:`, error);
        currentPage++;
      }
    }
    
    // Final progress update
    chrome.runtime.sendMessage({
      action: 'scanProgress',
      page: currentPage - 1,
      status: 'complete'
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scanPage(pageNum) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', pageNum.toString());
      
      const response = await fetch(url.toString());
      if (!response.ok) return [];
      
      const html = await response.text();
      const sanitizedHtml = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedHtml, 'text/html');
      
      return this.extractProfileLinksFromDoc(doc);
    } catch (error) {
      console.error(`Error scanning page ${pageNum}:`, error);
      return [];
    }
  }

  extractProfileLinksFromDoc(doc) {
    const profileLinks = new Set();
    const selectors = [
      'a[href^="/profile/"]',
      'a[href*="/profile/"]',
      '.username a',
      '.user-name a',
      '[data-username] a'
    ];

    selectors.forEach(selector => {
      try {
        const anchors = doc.querySelectorAll(selector);
        anchors.forEach(anchor => {
          const href = this.normalizeUrl(anchor.href || anchor.getAttribute('href'));
          if (href && this.isValidProfileUrl(href)) {
            profileLinks.add(href);
          }
        });
      } catch (error) {
        console.warn(`Error with selector ${selector}:`, error);
      }
    });

    return Array.from(profileLinks);
  }
}

// Initialize the extractor
new LeaderboardExtractor();
