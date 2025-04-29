// Configuration
const CONFIG = {
  CHECK_INTERVAL: 5, // minutes
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // ms
  NOTIFICATION_TIMEOUT: 5000, // ms
  MAX_HISTORY_ENTRIES: 50,
  URLS: {
    INTERNET_CHECK: 'http://1.1.1.1',
    LOGIN_PAGE: 'http://172.16.0.30:8090/httpclient.html',
    ALTERNATE_LOGIN: 'http://172.16.100.117/'
  }
};

// State management
let loginAttempts = 0;
let currentLoginTab = null;
let isEnabled = true;
let lastNotificationId = null;

// Initialize extension state
chrome.storage.local.get(['extensionEnabled'], (result) => {
  isEnabled = result.extensionEnabled !== false;
});

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Add login attempt to history
async function addLoginAttempt(success, message) {
  const { loginHistory = [], successCount = 0, totalAttempts = 0 } = 
    await chrome.storage.local.get(['loginHistory', 'successCount', 'totalAttempts']);

  // Add new entry to beginning of history
  const newHistory = [{
    timestamp: new Date().toISOString(),
    success,
    message
  }, ...loginHistory];

  // Keep only last N entries
  if (newHistory.length > CONFIG.MAX_HISTORY_ENTRIES) {
    newHistory.length = CONFIG.MAX_HISTORY_ENTRIES;
  }

  // Update storage with new statistics
  await chrome.storage.local.set({
    loginHistory: newHistory,
    successCount: successCount + (success ? 1 : 0),
    totalAttempts: totalAttempts + 1
  });
}

// Show notification
async function showNotification(title, message, type = 'default') {
  // Clear previous notification if exists
  if (lastNotificationId) {
    await chrome.notifications.clear(lastNotificationId);
  }

  const iconPath = {
    default: 'icons/icon128.png',
    success: 'icons/icon128.png',
    error: 'icons/icon128.png'
  };

  lastNotificationId = Date.now().toString();
  
  chrome.notifications.create(lastNotificationId, {
    type: 'basic',
    iconUrl: iconPath[type],
    title,
    message,
    priority: 1,
    silent: type === 'default'
  });

  // Auto clear notification
  setTimeout(() => {
    chrome.notifications.clear(lastNotificationId);
    lastNotificationId = null;
  }, CONFIG.NOTIFICATION_TIMEOUT);
}

// Check if a URL is reachable
async function isUrlReachable(url) {
  try {
    await fetch(url, { mode: 'no-cors' });
    return true;
  } catch (error) {
    console.log(`Failed to reach ${url}:`, error.message);
    return false;
  }
}

// Check if login is needed
async function isLoginNeeded() {
  try {
    // First check if login page is reachable
    const canReachLoginPage = await isUrlReachable(CONFIG.URLS.LOGIN_PAGE);
    if (!canReachLoginPage) {
      return false; // Can't reach login page, so no point trying to login
    }

    // Then check if we can reach internet
    const hasInternet = await isUrlReachable(CONFIG.URLS.INTERNET_CHECK);
    
    // We need to login if:
    // 1. We can reach the login page
    // 2. But can't reach the internet
    return !hasInternet;
  } catch (error) {
    console.error('Error checking login need:', error);
    return false;
  }
}

// Check internet connectivity
async function checkInternetConnectivity() {
  // First check if extension is enabled
  const { extensionEnabled } = await chrome.storage.local.get(['extensionEnabled']);
  if (extensionEnabled === false) {
    console.log('Extension is disabled, skipping check');
    return;
  }

  try {
    // Check if we need to login
    const needsLogin = await isLoginNeeded();
    
    if (!needsLogin) {
      console.log('Login not needed - either internet is working or login page is unreachable');
      return;
    }

    // Attempt login since we need it
    console.log('Login needed - attempting login...');
    await attemptLogin();
  } catch (error) {
    console.error('Error during connectivity check:', error);
    showNotification('Error', 'Failed to check connectivity', 'error');
    await addLoginAttempt(false, 'Connectivity check failed');
  }
}

// Get random credentials
async function getRandomCredentials() {
  const { usernames, passwords } = await chrome.storage.local.get(['usernames', 'passwords']);
  
  if (!usernames?.length || !passwords?.length || usernames.length !== passwords.length) {
    throw new Error('No valid credentials found');
  }

  // Get last used index
  const { lastUsedIndex = -1 } = await chrome.storage.local.get(['lastUsedIndex']);
  
  // Calculate next index, wrapping around to 0 if at end
  const nextIndex = (lastUsedIndex + 1) % usernames.length;
  
  // Save the new index
  await chrome.storage.local.set({ lastUsedIndex: nextIndex });

  return {
    username: usernames[nextIndex],
    password: passwords[nextIndex],
    index: nextIndex
  };
}

// Perform the login
async function performLogin(tabId, credentials) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
            func: (username, password) => {
      return new Promise((resolve, reject) => {
        try {
              const usernameField = document.querySelector("#username");
              const passwordField = document.querySelector("#password");
          
          if (!usernameField || !passwordField) {
            reject('Login form not found');
            return;
          }

          // Fill credentials
                usernameField.value = username;
                passwordField.value = password;

          // Create and dispatch enter key event
          const enterEvent = new KeyboardEvent("keydown", {
                  key: "Enter",
                  code: "Enter",
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
            cancelable: true
                });

          // Submit form
          passwordField.dispatchEvent(enterEvent);
          
          // Check for error messages
          setTimeout(() => {
            const errorElement = document.querySelector('.error-message, .alert-error');
            if (errorElement) {
              reject(errorElement.textContent.trim());
              } else {
              resolve('Login successful');
            }
          }, 2000);
        } catch (error) {
          reject(error.message);
        }
      });
    },
    args: [credentials.username, credentials.password]
  });

  return result[0].result;
}

// Update credential success rate
async function updateCredentialStats(index, success) {
  const { credentialStats = {} } = await chrome.storage.local.get(['credentialStats']);
  
  if (!credentialStats[index]) {
    credentialStats[index] = { success: 0, attempts: 0 };
  }
  
  credentialStats[index].attempts++;
  if (success) {
    credentialStats[index].success++;
  }

  await chrome.storage.local.set({ credentialStats });
}

// Main login attempt function
async function attemptLogin() {
  if (loginAttempts >= CONFIG.MAX_RETRIES) {
    const message = 'Maximum retry attempts reached';
    console.log(message);
    loginAttempts = 0;
    showNotification('Login Failed', message, 'error');
    await addLoginAttempt(false, message);
    return;
  }

  let credentials;
  try {
    // Get random credentials
    credentials = await getRandomCredentials();

    // Create login tab if needed
    if (!currentLoginTab) {
      const tab = await chrome.tabs.create({ 
        url: CONFIG.URLS.LOGIN_PAGE,
        active: false 
      });
      currentLoginTab = tab.id;
    }

    // Wait for page load
    await new Promise(resolve => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === currentLoginTab && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    // Perform login
    const loginResult = await performLogin(currentLoginTab, credentials);
    
    // Clean up
    await chrome.tabs.remove(currentLoginTab);
    currentLoginTab = null;
    loginAttempts = 0;

    // Update stats
    await updateCredentialStats(credentials.index, true);
    await addLoginAttempt(true, loginResult);

    // Notify success
    chrome.runtime.sendMessage({
      action: 'loginStatus',
      status: loginResult,
      success: true
    });

    showNotification('Success', 'Successfully logged in to BITS WiFi', 'success');

  } catch (error) {
    console.error('Login attempt failed:', error);
    loginAttempts++;

    // Update stats
    if (credentials) {
      await updateCredentialStats(credentials.index, false);
    }
    await addLoginAttempt(false, error.message);

    // Notify error
    chrome.runtime.sendMessage({
      action: 'loginStatus',
      status: `Login failed: ${error.message}`,
      success: false
    });

    showNotification('Login Failed', error.message, 'error');

    // Clean up failed attempt
    if (currentLoginTab) {
      await chrome.tabs.remove(currentLoginTab);
      currentLoginTab = null;
    }

    // Retry after delay if not max attempts
    if (loginAttempts < CONFIG.MAX_RETRIES) {
      await delay(CONFIG.RETRY_DELAY);
      await attemptLogin();
    }
  }
}

// Set up periodic check
chrome.alarms.create('checkInternet', { periodInMinutes: CONFIG.CHECK_INTERVAL });

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkInternet') {
    checkInternetConnectivity();
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkInternetConnectivity") {
    checkInternetConnectivity();
  }
  
  if (request.action === "toggleExtension") {
    isEnabled = request.enabled;
    console.log(`Extension is now ${isEnabled ? 'enabled' : 'disabled'}`);
    showNotification(
      'Extension Status',
      `Auto login is now ${isEnabled ? 'enabled' : 'disabled'}`,
      isEnabled ? 'success' : 'default'
    );
  }
});

// Initial check
checkInternetConnectivity();