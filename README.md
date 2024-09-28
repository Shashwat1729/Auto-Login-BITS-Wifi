# Auto Login Extension

This Chrome Extension automatically logs into a specified portal using multiple credentials while ensuring seamless internet connectivity. It provides an intuitive interface to manage credentials, track connection status, and control the extension's functionality from a user-friendly popup.

## Features:
- **Automated Login**: Automatically logs into the portal when connected to a specific network.
- **Multiple Credentials**: Save and use multiple username-password combinations; the extension randomly selects a pair for each login attempt.
- **Internet Connectivity Check**: Continuously monitors network connectivity and triggers login when needed.
- **Toggle Extension**: Easily enable or disable the extension via a switch in the popup.
- **Manual Internet Check**: Allows manual checking of internet connectivity with a single button.
- **Modern UI**: The extension comes with a clean, modern user interface for managing settings and interaction.

## Installation:
1. **Download the Extension**:
   - Clone or download the repository:
     ```bash
     git clone https://github.com/Shashwat1729/Auto-Login-BITS-Wifi.git
     ```

2. **Load the Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable "Developer mode" using the toggle switch.
   - Click "Load unpacked" and select the folder where the extension is downloaded.

3. **Configure Credentials**:
   - Right-click the extension icon and select `Options`.
   - Add multiple usernames and passwords to be used for automatic login.

4. **Use the Extension**:
   - The extension will automatically check for internet connectivity and log in when required.
   - You can manually trigger it via the popup by clicking the "Check Internet & Login" button.

5. **Toggle Extension**:
   - Enable or disable the extension functionality using the switch in the popup. 

## Updated UI and Files:
- **Popup UI**: The extension popup allows you to toggle the extension, check connectivity, and access the settings page.
- **Settings Page (Options)**: A modern interface to save and manage multiple usernames and passwords.
- **Icons**: Includes custom icons to make the extension more identifiable.
  
## Files:
- **`manifest.json`**: Extension metadata, permissions, and settings for icons.
- **`background.js`**: Handles connectivity checks, login attempts, and periodic alarms for network monitoring.
- **`popup.html`, `popup.js`**: Provides an interactive popup to control the extension and trigger actions.
- **`options.html`, `options.js`**: Allows users to store and manage multiple credentials for login.
- **`icons/`**: Contains icons used in the extension for better user experience.

## Troubleshooting:
- **Login Fails**: Ensure that valid credentials are stored in the options page and that the network connection is available.
- **No Internet Connection Detected**: The extension checks specific URLs (e.g., `http://172.16.0.30:8090/httpclient.html`) to confirm connectivity. Ensure you're connected to the correct network.
