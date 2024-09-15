let loginTabId = null;

function getRandomPassword(passwords) {
  return passwords[Math.floor(Math.random() * passwords.length)];
}

// Check internet connectivity by pinging an IP (like a DNS server or college portal)
function checkInternetConnectivity() {
  fetch("http://1.1.1.1", { mode: 'no-cors' }) // Use 'no-cors' to avoid CORS issues
    .then((response) => {
      console.log('Internet is connected');
    })
    .catch((error) => {
      console.log('No internet connection, attempting to log in...');
      attemptLogin();
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

    // Choose a random password for login
    const randomPassword = getRandomPassword(passwords);

    // Open the login page in a new tab
    chrome.tabs.create(
      { url: "http://172.16.0.30:8090/httpclient.html" },
      (loginTab) => {
        loginTabId = loginTab.id;

        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === loginTabId && info.status === "complete") {
            // Randomly select a username for each login attempt
            const randomUsername = usernames[Math.floor(Math.random() * usernames.length)];

            // Fill in the login form and submit
            chrome.scripting.executeScript({
              target: { tabId: loginTabId },
              func: (username, password) => {
                const usernameField = document.querySelector("#username");
                const passwordField = document.querySelector("#password");
                if (usernameField && passwordField) {
                  usernameField.value = username;
                  passwordField.value = password;

                  // Create and dispatch an Enter key event on the password field
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
      }
    );
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
