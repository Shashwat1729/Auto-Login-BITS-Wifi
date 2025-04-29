// DOM Elements
const toggleSwitch = document.getElementById("toggleExtension");
const statusMessage = document.getElementById("statusMessage");
const statusText = document.getElementById("statusText");
const connectionDot = document.getElementById("connectionDot");
const connectionStatus = document.getElementById("connectionStatus");
const loginSpinner = document.getElementById("loginSpinner");
const checkInternetBtn = document.getElementById("checkInternet");
const lastLogin = document.getElementById("lastLogin");
const successRate = document.getElementById("successRate");
const networkName = document.getElementById("networkName");
const signalStrength = document.getElementById("signalStrength");
const historyList = document.getElementById("historyList");

// State management
let isChecking = false;

// Initialize popup
async function initializePopup() {
  // Load extension state and statistics
  const result = await chrome.storage.local.get([
    "extensionEnabled",
    "loginHistory",
    "successCount",
    "totalAttempts",
    "lastConnectionStatus"
  ]);

  // Set extension state
  const isEnabled = result.extensionEnabled !== false;
  toggleSwitch.checked = isEnabled;
  updateStatusText(isEnabled);

  // Update statistics
  updateLoginStats(result.loginHistory || []);
  updateSuccessRate(result.successCount || 0, result.totalAttempts || 0);

  // Restore last known connection status if available
  if (result.lastConnectionStatus) {
    updateConnectionStatus(
      result.lastConnectionStatus.isConnected,
      result.lastConnectionStatus.message
    );
  }

  // Check connection status without initiating login
  await checkConnectionOnly();
}

// Update status text based on extension state
function updateStatusText(isEnabled) {
  statusText.textContent = isEnabled ? "Enabled" : "Disabled";
}

// Format date for display
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Update login statistics
function updateLoginStats(history) {
  if (history && history.length > 0) {
    const lastLoginTime = new Date(history[0].timestamp);
    lastLogin.textContent = formatDate(lastLoginTime);
    
    // Update history list
    historyList.innerHTML = history.slice(0, 5).map(entry => `
      <div class="history-item">
        <span>${entry.success ? '✓' : '✗'} ${entry.message}</span>
        <span class="history-time">${formatDate(new Date(entry.timestamp))}</span>
      </div>
    `).join('');
  } else {
    lastLogin.textContent = 'Never';
    historyList.innerHTML = '<div class="history-item"><div class="credential-info">No login history</div></div>';
  }
}

// Update success rate
function updateSuccessRate(successCount, totalAttempts) {
  if (totalAttempts > 0) {
    const rate = Math.round((successCount / totalAttempts) * 100);
    successRate.textContent = `${rate}% (${successCount}/${totalAttempts})`;
  } else {
    successRate.textContent = 'No attempts';
  }
}

// Show status message with type (success/error)
function showStatusMessage(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  setTimeout(() => {
    statusMessage.className = 'status-message';
  }, 3000);
}

// Update connection status UI and save state
function updateConnectionStatus(isConnected, message) {
  connectionDot.className = `status-dot ${isConnected ? 'connected' : 'disconnected'}`;
  connectionStatus.textContent = message;

  // Save the connection status
  chrome.storage.local.set({
    lastConnectionStatus: { isConnected, message }
  });
}

// Get network information
async function getNetworkInfo() {
  try {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      networkName.textContent = connection.type || 'Unknown';
    }

    // Try to get WiFi information if available
    if ('getNetworkInformation' in navigator) {
      const info = await navigator.getNetworkInformation();
      if (info.type === 'wifi') {
        signalStrength.textContent = `${info.signalStrength}%`;
      }
    }
  } catch (error) {
    console.log('Network info not available:', error);
    networkName.textContent = 'Unknown';
    signalStrength.textContent = '-';
  }
}

// Toggle loading state
function setLoading(loading) {
  isChecking = loading;
  loginSpinner.style.display = loading ? 'block' : 'none';
  checkInternetBtn.disabled = loading;
}

// Check connection status without login
async function checkConnectionOnly() {
  try {
    // First check general internet connectivity
    const internetCheck = await fetch("http://1.1.1.1", { mode: 'no-cors' });
    updateConnectionStatus(true, 'Internet connected');
    await getNetworkInfo();

    try {
      // Then check BITS network
      const networkCheck = await fetch("http://172.16.0.30:8090/httpclient.html", { mode: 'no-cors' });
      updateConnectionStatus(true, 'BITS network connected');
    } catch (networkError) {
      updateConnectionStatus(false, 'Not connected to BITS network');
    }
  } catch (internetError) {
    updateConnectionStatus(false, 'No internet connection');
  }
}

// Check internet and attempt login
async function checkInternetAndLogin() {
  if (isChecking) return;
  
  setLoading(true);
  updateConnectionStatus(false, 'Checking connection...');

  try {
    // First check general internet connectivity
    const internetCheck = await fetch("http://1.1.1.1", { mode: 'no-cors' });
    updateConnectionStatus(true, 'Internet connected');
    await getNetworkInfo();

    try {
      // Then check BITS network
      const networkCheck = await fetch("http://172.16.0.30:8090/httpclient.html", { mode: 'no-cors' });
      updateConnectionStatus(true, 'BITS network connected');
      
      // Attempt login
      chrome.runtime.sendMessage({ action: "checkInternetConnectivity" });
      showStatusMessage('Login attempt initiated', 'success');
    } catch (networkError) {
      const message = 'Not connected to BITS network';
      updateConnectionStatus(false, message);
      showStatusMessage('Please connect to BITS network', 'error');
    }
  } catch (internetError) {
    const message = 'No internet connection';
    updateConnectionStatus(false, message);
    showStatusMessage(message, 'error');
  } finally {
    setLoading(false);
  }
}

// Toggle the extension on or off
toggleSwitch.addEventListener("change", () => {
  const isEnabled = toggleSwitch.checked;
  
  chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
    updateStatusText(isEnabled);
    showStatusMessage(`Extension ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
  });

  chrome.runtime.sendMessage({ 
    action: "toggleExtension", 
    enabled: isEnabled 
  });
});

// Trigger internet check and login when the button is clicked
checkInternetBtn.addEventListener("click", checkInternetAndLogin);

// Open the settings page when the settings button is clicked
document.getElementById("openSettings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "loginStatus") {
    showStatusMessage(message.status, message.success ? 'success' : 'error');
    
    // Refresh statistics after login attempt
    chrome.storage.local.get(["loginHistory", "successCount", "totalAttempts"], (result) => {
      updateLoginStats(result.loginHistory || []);
      updateSuccessRate(result.successCount || 0, result.totalAttempts || 0);
    });
  }
});

// Initialize popup when opened
document.addEventListener('DOMContentLoaded', initializePopup);
