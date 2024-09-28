// Get references to the toggle switch and buttons
const toggleSwitch = document.getElementById("toggleExtension");
const statusMessage = document.getElementById("statusMessage");

// Load and set the extension's enabled state from storage
chrome.storage.local.get(["extensionEnabled"], (result) => {
  toggleSwitch.checked = result.extensionEnabled !== false; // Default is enabled if not set
});

// Toggle the extension on or off
toggleSwitch.addEventListener("change", () => {
  const isEnabled = toggleSwitch.checked;
  
  chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
    statusMessage.textContent = isEnabled ? "Extension enabled" : "Extension disabled";
    setTimeout(() => statusMessage.textContent = '', 2000); // Clear message after 2 seconds
  });

  // Optionally send a message to background to perform some action
  chrome.runtime.sendMessage({ action: "toggleExtension", enabled: isEnabled });
});

// Trigger internet check and login when the button is clicked
document.getElementById("checkInternet").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "checkInternetConnectivity" });
});

// Open the settings page when the settings button is clicked
document.getElementById("openSettings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
