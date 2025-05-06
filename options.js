document.addEventListener("DOMContentLoaded", () => {
  const usernamesEl = document.getElementById("usernames");
  const passwordsEl = document.getElementById("passwords");
  const saveButton = document.getElementById("saveButton");
  const resetButton = document.getElementById("resetButton");
  const statusMessage = document.getElementById("statusMessage");
  const credentialsList = document.getElementById("credentialsList");

  function showStatus(msg, type = "success") {
    if (!statusMessage) return;
    statusMessage.textContent = msg;
    statusMessage.className = `status-message show ${type}`;
    setTimeout(() => {
      statusMessage.className = "status-message";
      statusMessage.textContent = "";
    }, 2000);
  }

  function loadCredentials() {
    if (!usernamesEl || !passwordsEl || !credentialsList) return;
    chrome.storage.local.get(["usernames", "passwords"], (result) => {
      const usernames = Array.isArray(result.usernames) ? result.usernames : [];
      const passwords = Array.isArray(result.passwords) ? result.passwords : [];
      usernamesEl.value = usernames.join("\n");
      passwordsEl.value = passwords.join("\n");
      renderCredentialsList(usernames, passwords);
    });
  }

  function renderCredentialsList(usernames, passwords) {
    if (!credentialsList) return;
    credentialsList.innerHTML = "";
    if (!usernames.length) {
      credentialsList.innerHTML = '<div class="credential-item"><span>No credentials saved</span></div>';
      return;
    }
    usernames.forEach((username, idx) => {
      const password = passwords[idx] || "";
      const div = document.createElement("div");
      div.className = "credential-item";
      div.innerHTML = `
        <div class="credential-info">
          <span class="credential-username">${username}</span>
          <span class="credential-password">${password ? "••••••" : "<em>No password</em>"}</span>
        </div>
        <button class="delete-button" data-index="${idx}">Delete</button>
      `;
      credentialsList.appendChild(div);
    });
    // Add delete listeners
    credentialsList.querySelectorAll(".delete-button").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.getAttribute("data-index"));
        deleteCredential(idx);
      });
    });
  }

  function deleteCredential(idx) {
    chrome.storage.local.get(["usernames", "passwords"], (result) => {
      let usernames = Array.isArray(result.usernames) ? result.usernames : [];
      let passwords = Array.isArray(result.passwords) ? result.passwords : [];
      usernames.splice(idx, 1);
      passwords.splice(idx, 1);
      chrome.storage.local.set({ usernames, passwords }, () => {
        showStatus("Credential deleted", "success");
        loadCredentials();
      });
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      if (!usernamesEl || !passwordsEl) return;
      const usernames = usernamesEl.value.split("\n").map(u => u.trim()).filter(Boolean);
      const passwords = passwordsEl.value.split("\n").map(p => p.trim()).filter(Boolean);
      if (usernames.length !== passwords.length) {
        showStatus("Usernames and passwords count must match.", "error");
        return;
      }
      chrome.storage.local.set({ usernames, passwords }, () => {
        showStatus("Credentials saved", "success");
        loadCredentials();
      });
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (usernamesEl) usernamesEl.value = "";
      if (passwordsEl) passwordsEl.value = "";
      if (statusMessage) {
        statusMessage.className = "status-message";
        statusMessage.textContent = "";
      }
    });
  }

  loadCredentials();
});

