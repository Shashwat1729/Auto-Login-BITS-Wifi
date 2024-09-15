# Auto Login Extension

## Description
This Chrome extension automates the login process for the college network portal. It allows users to save multiple credentials (usernames and passwords) and automatically log in to the portal with a randomly chosen password for each login attempt. The extension also checks for internet connectivity and logs in if no connection is detected.

## Features
- Automatically checks for internet connectivity every 5 minutes.
- Automatically fills in the username and randomly selected password on the login page.
- Allows saving multiple usernames and passwords.
- Automatically logs in to the portal and closes the login tab upon success.

## Installation

1. **Download the Extension**:
   - Clone or download the repository:
     ```bash
     git clone https://github.com/shaitanu/bitswifi-extension.git
     ```

2. **Load the Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable "Developer mode" using the toggle switch.
   - Click "Load unpacked" and select the extension directory from the cloned repository.

3. **Set Your Credentials**:
   - Right-click the extension icon and open `options`. Enter multiple usernames and passwords (comma-separated) and save them.

4. **Use the Extension**:
   - The extension will automatically attempt to log in every 5 minutes if internet connectivity is not detected.

## Troubleshooting
- **Extension Not Working**: Ensure that the credentials are correctly set and that the extension is properly loaded.
- **Internet Issues**: If internet is not being detected, verify that the connection is available and the extension permissions are correct.
