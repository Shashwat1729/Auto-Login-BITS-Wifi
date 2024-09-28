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
function attemptLogin() {
  chrome.storage.local.get(["usernames", "passwords"], (result) => {
    const usernames = result.usernames || [];
    const passwords = result.passwords || [];

    if (usernames.length === 0 || passwords.length === 0) {
      console.error('No stored credentials');
      return;
    }

    if (usernames.length !== passwords.length) {
      console.error('Usernames and passwords count mismatch');
      return;
    }

    const randomIndex = Math.floor(Math.random() * usernames.length);
    const randomUsername = usernames[randomIndex];
    const randomPassword = passwords[randomIndex];

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
    checkInternetConnectivity();
  }
  
  if (request.action === "toggleExtension") {
    const isEnabled = request.enabled;
    console.log(`Extension is now ${isEnabled ? 'enabled' : 'disabled'}`);
  }
});
