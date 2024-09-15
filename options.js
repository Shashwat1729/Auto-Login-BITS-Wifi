document.addEventListener("DOMContentLoaded", () => {
  // Load stored credentials if they exist
  chrome.storage.local.get(["usernames", "passwords"], (result) => {
    if (result.usernames) {
      document.getElementById("usernames").value = result.usernames.join(', ');
    }
    if (result.passwords) {
      document.getElementById("passwords").value = result.passwords.join(', ');
    }
  });

  document.getElementById("save").addEventListener("click", () => {
    const usernames = document.getElementById("usernames").value.split(',').map(u => u.trim());
    const passwords = document.getElementById("passwords").value.split(',').map(p => p.trim());

    // Save the credentials to Chrome storage
    chrome.storage.local.set({ usernames, passwords }, () => {
      document.getElementById("status").textContent = "Credentials saved";
    });
  });
});
