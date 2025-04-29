// DOM Elements
const usernamesTextarea = document.getElementById('usernames');
const passwordsTextarea = document.getElementById('passwords');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const statusMessage = document.getElementById('statusMessage');
const credentialsList = document.getElementById('credentialsList');

// Load saved credentials
function loadCredentials() {
  chrome.storage.local.get(['usernames', 'passwords'], (result) => {
    const usernames = result.usernames || [];
    const passwords = result.passwords || [];
    
    usernamesTextarea.value = usernames.join('\n');
    passwordsTextarea.value = passwords.join('\n');
    
    updateCredentialsList(usernames, passwords);
  });
}

// Update the credentials list display
function updateCredentialsList(usernames, passwords) {
  credentialsList.innerHTML = '';
  
  if (!usernames.length) {
    credentialsList.innerHTML = `
      <div class="credential-item">
        <div class="credential-info">No credentials saved</div>
      </div>
    `;
    return;
  }

  usernames.forEach((username, index) => {
    const item = document.createElement('div');
    item.className = 'credential-item';
    
    const maskedPassword = '•'.repeat(passwords[index]?.length || 0);
    
    item.innerHTML = `
      <div class="credential-info">
        <span class="credential-username">${username}</span>
        <span class="credential-password">${maskedPassword}</span>
      </div>
      <button class="delete-button" data-index="${index}">Delete</button>
    `;
    
    credentialsList.appendChild(item);
  });

  // Add delete button listeners
  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      deleteCredential(index);
    });
  });
}

// Delete a credential pair
function deleteCredential(index) {
  chrome.storage.local.get(['usernames', 'passwords'], (result) => {
    const usernames = result.usernames || [];
    const passwords = result.passwords || [];
    
    usernames.splice(index, 1);
    passwords.splice(index, 1);
    
    chrome.storage.local.set({ usernames, passwords }, () => {
      loadCredentials();
      showStatus('Credential deleted successfully', 'success');
    });
  });
}

// Show status message
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  setTimeout(() => {
    statusMessage.className = 'status-message';
  }, 3000);
}

// Save credentials
function saveCredentials() {
  const usernames = usernamesTextarea.value.split('\n').filter(u => u.trim());
  const passwords = passwordsTextarea.value.split('\n').filter(p => p.trim());

  if (usernames.length !== passwords.length) {
    showStatus('Number of usernames and passwords must match', 'error');
    return;
  }

  if (usernames.length === 0) {
    showStatus('Please enter at least one username and password', 'error');
    return;
  }

  chrome.storage.local.set({ usernames, passwords }, () => {
    showStatus('Credentials saved successfully', 'success');
    loadCredentials();
  });
}

// Reset form
function resetForm() {
  usernamesTextarea.value = '';
  passwordsTextarea.value = '';
  showStatus('Form reset', 'success');
}

// Event Listeners
saveButton.addEventListener('click', saveCredentials);
resetButton.addEventListener('click', resetForm);

// Initialize
document.addEventListener('DOMContentLoaded', loadCredentials);
