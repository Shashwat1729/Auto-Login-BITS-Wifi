# BITS Auto Login Extension

This Chrome Extension automatically logs into the BITS college portal using multiple credentials and checks for internet connectivity in the background. It allows users to save multiple usernames and passwords, and randomly selects a combination during each login attempt.

## Features:
- **Automated Login**: Automatically logs into the BITS college Wi-Fi portal using saved credentials.
- **Multiple Credentials**: Supports saving and using multiple username-password combinations, randomly selected for each login.
- **Internet Connectivity Check**: Periodically checks for internet connectivity and attempts login if the connection is down.
- **Random Credential Selection**: Randomly selects a username-password pair from the saved credentials for login attempts.
- **Periodic Connectivity Check**: Uses Chrome's `alarms` API to regularly check and ensure that the internet is connected.

## Installation:
1. **Download the Extension**:
   - Clone or download the repository:
     ```bash
     git clone https://github.com/your-username/bits-auto-login-extension](https://github.com/Shashwat1729/Auto-Login-BITS-Wifi.git
     ```

2. **Load the Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable "Developer mode" using the toggle switch.
   - Click "Load unpacked" and select the folder where this extension was downloaded.

3. **Configure Credentials**:
   - Right-click the extension icon and select `Options`.
   - Add multiple usernames and passwords to be used for automatic login.

4. **Use the Extension**:
   - The extension will automatically check for internet connectivity and log in when required. You can manually trigger it by clicking the extension icon.

## Files:
- **`manifest.json`**: Specifies extension metadata, permissions, and background services.
- **`background.js`**: Contains the core logic for connectivity checking and automatic login using randomly selected credentials.
- **`options.html` & `options.js`**: Provide an interface to save and manage multiple credentials.
- **`icons/`**: Contains icons used for the extension.

## Troubleshooting:
- **Login Fails**: Ensure that valid credentials are stored in the options page and that the extension has been given appropriate permissions.
- **No Internet Connection Detected**: The extension pings a DNS server to check for connectivity. Make sure you’re using the correct internal network (like the campus Wi-Fi).

