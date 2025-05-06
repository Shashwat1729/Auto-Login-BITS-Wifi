// DOM references
const toggleSwitch = document.getElementById("toggleExtension");
const statusText = document.getElementById("statusText");
const statusMessage = document.getElementById("statusMessage");
const checkBtn = document.getElementById("checkInternet");
const loginSpinner = document.getElementById("loginSpinner");
const connectionDot = document.getElementById("connectionDot");
const connectionStatus = document.getElementById("connectionStatus");
const lastLogin = document.getElementById("lastLogin");
const historyList = document.getElementById("historyList");
const lastUsername = document.getElementById("lastUsername");
const usernameSelect = document.getElementById("usernameSelect");
const clearActivityBtn = document.getElementById("clearActivityBtn");

// Load and set the extension's enabled state from storage
if (toggleSwitch && statusText) {
  chrome.storage.local.get(["extensionEnabled"], (result) => {
    const enabled = result.extensionEnabled !== false; // Default is enabled
    toggleSwitch.checked = enabled;
    statusText.textContent = enabled ? "Enabled" : "Disabled";
  });
}

// Toggle the extension on or off
function showStatusMessage(msg, type = "success") {
  if (!statusMessage) return;
  statusMessage.textContent = msg;
  statusMessage.className = `status-message show ${type}`;
  setTimeout(() => {
    statusMessage.className = "status-message";
    statusMessage.textContent = "";
  }, 2000);
}

if (toggleSwitch) {
  toggleSwitch.addEventListener("change", () => {
    const isEnabled = toggleSwitch.checked;
    chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
      if (statusText) statusText.textContent = isEnabled ? "Enabled" : "Disabled";
      showStatusMessage(isEnabled ? "Extension enabled" : "Extension disabled", "success");
    });
    chrome.runtime.sendMessage({ action: "toggleExtension", enabled: isEnabled });
  });
}

// Populate username dropdown
function populateUsernameDropdown() {
  if (!usernameSelect) return;
  chrome.storage.local.get(["usernames"], (result) => {
    const usernames = Array.isArray(result.usernames) ? result.usernames : [];
    usernameSelect.innerHTML = '<option value="random">Random</option>';
    usernames.forEach((u, i) => {
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = u;
      usernameSelect.appendChild(opt);
    });
  });
}

// Modified Check & Login button logic
if (checkBtn && loginSpinner) {
  checkBtn.addEventListener("click", () => {
    loginSpinner.style.display = "inline-block";
    checkBtn.setAttribute("disabled", "disabled");
    // Pass selected username to background
    const selectedUsername = usernameSelect ? usernameSelect.value : "random";
    chrome.runtime.sendMessage({ action: "checkInternetConnectivity", username: selectedUsername }, (response) => {
      loginSpinner.style.display = "none";
      checkBtn.removeAttribute("disabled");
      if (response && response.success) {
        showStatusMessage("Login successful!", "success");
      } else if (response && response.error) {
        showStatusMessage(response.error, "error");
      } else {
        showStatusMessage("Login attempt finished.", "success");
      }
    });
  });
}

const openSettingsBtn = document.getElementById("openSettings");
if (openSettingsBtn) {
  openSettingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

// Connection status dot and text
function updateConnectionStatus(status) {
  if (!connectionDot || !connectionStatus) return;
  if (status === "connected") {
    connectionDot.classList.add("connected");
    connectionDot.classList.remove("disconnected");
    connectionStatus.textContent = "Connected to BITS Network";
  } else if (status === "disconnected") {
    connectionDot.classList.add("disconnected");
    connectionDot.classList.remove("connected");
    connectionStatus.textContent = "Not connected";
  } else {
    connectionDot.classList.remove("connected", "disconnected");
    connectionStatus.textContent = "Checking connection...";
  }
}

// Only update lastLogin and lastUsername
function updateStats(stats = {}) {
  if (lastLogin) lastLogin.textContent = stats.lastLogin || "Never";
  if (lastUsername) lastUsername.textContent = stats.lastUsername || "-";
}

function updateHistory(history = []) {
  if (!historyList) return;
  historyList.innerHTML = "";
  if (!history.length) {
    historyList.innerHTML = '<div class="history-item"><span>No recent activity</span></div>';
    return;
  }
  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<span>${item.action}</span><span class="history-time">${item.time}</span>`;
    historyList.appendChild(div);
  });
}

// Clear Activity button
if (clearActivityBtn) {
  clearActivityBtn.addEventListener("click", () => {
    chrome.storage.local.set({ history: [] }, () => {
      updateHistory([]);
      showStatusMessage("Activity cleared", "success");
    });
  });
}

// Initial load: get stats and connection
function loadPopupData() {
  updateConnectionStatus();
  updateStats();
  updateHistory();
  populateUsernameDropdown();
  chrome.runtime.sendMessage({ action: "getPopupData" }, (response) => {
    if (response) {
      updateConnectionStatus(response.connectionStatus);
      updateStats(response.stats);
      updateHistory(response.history);
      populateUsernameDropdown();
    } else {
      showStatusMessage("Failed to load popup data.", "error");
    }
  });
}

loadPopupData();
