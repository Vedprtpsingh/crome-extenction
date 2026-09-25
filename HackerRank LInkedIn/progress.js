class ProgressManager {
  constructor() {
    this.numberEl = document.getElementById('progress-number');
    this.usernameEl = document.getElementById('progress-username');
    this.init();
  }

  init() {
    if (!this.numberEl || !this.usernameEl) {
      console.error('Progress elements not found');
      return;
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });

    // Initialize display
    this.updateDisplay(0, 0, 'Initializing...');
  }

  handleMessage(message, sender, sendResponse) {
    try {
      if (message.action === 'updateProgress') {
        this.updateDisplay(
          message.current || 0,
          message.total || 0,
          message.username || ''
        );
        sendResponse({ status: 'Progress updated' });
      }
    } catch (error) {
      console.error('Error handling progress message:', error);
      sendResponse({ error: error.message });
    }
  }

  updateDisplay(current, total, username) {
    try {
      this.numberEl.textContent = `${current} / ${total}`;
      this.usernameEl.textContent = username;
      
      // Update progress percentage if elements exist
      const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
      document.title = `Processing... ${percentage}%`;
    } catch (error) {
      console.error('Error updating display:', error);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ProgressManager();
});
