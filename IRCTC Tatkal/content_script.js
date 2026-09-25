// Content script injected into IRCTC pages to automate autofill, auto-login, and booking

(function() {
  console.log('IRCTC automation content script loaded');

  // Wait for Angular app to render and DOM to be ready
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const intervalTime = 100;
      let elapsedTime = 0;
      const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(interval);
          resolve(element);
        }
        elapsedTime += intervalTime;
        if (elapsedTime >= timeout) {
          clearInterval(interval);
          reject(new Error('Element not found: ' + selector));
        }
      }, intervalTime);
    });
  }

  // Example: Autofill login form
  async function autofillLogin(username, password) {
    try {
      const userInput = await waitForElement('input[name="userId"]');
      const passInput = await waitForElement('input[name="pwd"]');
      userInput.value = username;
      passInput.value = password;
      console.log('Autofilled login credentials');
    } catch (error) {
      console.error('Login autofill failed:', error);
    }
  }

  // Example: Autofill journey details on train search page
  async function autofillJourneyDetails(source, destination, date) {
    try {
      const sourceInput = await waitForElement('input[formcontrolname="stationFrom"]');
      const destInput = await waitForElement('input[formcontrolname="stationTo"]');
      const dateInput = await waitForElement('input[formcontrolname="journeyDate"]');
      sourceInput.value = source;
      destInput.value = destination;
      dateInput.value = date;
      sourceInput.dispatchEvent(new Event('input', { bubbles: true }));
      destInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('Autofilled journey details');
    } catch (error) {
      console.error('Journey autofill failed:', error);
    }
  }

  // Listen for messages from background or popup scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofillLogin') {
      autofillLogin(request.username, request.password);
      sendResponse({ success: true });
    } else if (request.action === 'autofillJourney') {
      autofillJourneyDetails(request.source, request.destination, request.date);
      sendResponse({ success: true });
    }
  });

})();
