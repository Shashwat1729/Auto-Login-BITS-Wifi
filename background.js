let loginTabId = null;

// Function to check internet connectivity
function checkInternetConnectivity() {
  fetch("http://1.1.1.1", { mode: 'no-cors' }) // Pinging an IP address
    .then(() => {
      console.log('Internet is connected');
    })
    .catch(() => {
      // Only attempt login if the specific page is reachable (e.g., http://172.16.0.30:8090/httpclient.html)
      fetch("http://172.16.0.30:8090/httpclient.html", { mode: 'no-cors' })
        .then(() => {
          console.log('Connected to specific network, attempting login...');
          attemptLogin();
        })
        .catch(() => {
          console.log('Cannot access login page, skipping login attempt.');
        });
    });
}

// Perform the login process
function attemptLogin(selectedUsername) {
  chrome.storage.local.get(["usernames", "passwords", "history"], (result) => {
    const usernames = result.usernames || [];
    const passwords = result.passwords || [];
    const history = Array.isArray(result.history) ? result.history : [];

    if (usernames.length === 0 || passwords.length === 0) {
      console.error('No stored credentials');
      return;
    }

    if (usernames.length !== passwords.length) {
      console.error('Usernames and passwords count mismatch');
      return;
    }

    let randomIndex = 0;
    let randomUsername = usernames[0];
    let randomPassword = passwords[0];
    if (selectedUsername && selectedUsername !== 'random') {
      randomIndex = usernames.indexOf(selectedUsername);
      if (randomIndex === -1) randomIndex = 0;
      randomUsername = usernames[randomIndex];
      randomPassword = passwords[randomIndex];
    } else {
      randomIndex = Math.floor(Math.random() * usernames.length);
      randomUsername = usernames[randomIndex];
      randomPassword = passwords[randomIndex];
    }

    chrome.tabs.create({ url: "http://172.16.0.30:8090/httpclient.html" }, (loginTab) => {
      loginTabId = loginTab.id;

      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === loginTabId && info.status === "complete") {
          chrome.scripting.executeScript({
            target: { tabId: loginTabId },
            func: (username, password) => {
              const usernameField = document.querySelector("#username");
              const passwordField = document.querySelector("#password");
              if (usernameField && passwordField) {
                usernameField.value = username;
                passwordField.value = password;

                const event = new KeyboardEvent("keydown", {
                  key: "Enter",
                  code: "Enter",
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true,
                });
                passwordField.dispatchEvent(event);
              } else {
                console.error('Login form fields not found');
              }
            },
            args: [randomUsername, randomPassword]
          }).catch(err => console.error("Error executing login script:", err));

          // Update lastLogin, lastUsername, and history after login attempt
          const now = new Date().toLocaleString();
          history.unshift({ action: `Login as ${randomUsername}`, time: now });
          if (history.length > 10) history.length = 10;
          chrome.storage.local.set({
            lastLogin: now,
            lastUsername: randomUsername,
            history
          });

          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    });
  });
}

// Periodically check for internet connectivity (every 5 minutes)
chrome.alarms.create('checkInternet', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkInternet') {
    checkInternetConnectivity();
  }
});

// Initial check when extension is loaded
checkInternetConnectivity();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkInternetConnectivity") {
    // Try to check connectivity and attempt login, then respond
    fetch("http://1.1.1.1", { mode: 'no-cors' })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(() => {
        // Try the login page
        fetch("http://172.16.0.30:8090/httpclient.html", { mode: 'no-cors' })
          .then(() => {
            attemptLogin(request.username); // Use selected username
            sendResponse({ success: true });
          })
          .catch(() => {
            sendResponse({ error: "Cannot access login page." });
          });
      });
    return true; // keep the message channel open for async response
  }

  if (request.action === "toggleExtension") {
    const isEnabled = request.enabled;
    console.log(`Extension is now ${isEnabled ? 'enabled' : 'disabled'}`);
  }

  if (request.action === "checkBitsNetworkStatus") {
    fetch("http://172.16.0.30:8090/httpclient.html", { mode: 'no-cors' })
      .then(() => sendResponse({ status: "connected" }))
      .catch(() => sendResponse({ status: "not_connected" }));
    return true;
  }

  if (request.action === "getPopupData") {
    // Check network status first
    fetch("http://172.16.0.30:8090/httpclient.html", { mode: 'no-cors' })
      .then(() => {
        chrome.storage.local.get(["lastLogin", "lastUsername", "history"], (result) => {
          sendResponse({
            connectionStatus: "connected",
            stats: {
              lastLogin: result.lastLogin || "Never",
              lastUsername: result.lastUsername || "-"
            },
            history: result.history || []
          });
        });
      })
      .catch((err) => {
        console.warn("BITS network check failed:", err);
        chrome.storage.local.get(["lastLogin", "lastUsername", "history"], (result) => {
          sendResponse({
            connectionStatus: "disconnected",
            stats: {
              lastLogin: result.lastLogin || "Never",
              lastUsername: result.lastUsername || "-"
            },
            history: result.history || []
          });
        });
      });
    return true;
  }
});
