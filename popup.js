document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const saveUsernameButton = document.getElementById('saveUsername');
    const toggleScriptButton = document.getElementById('toggleScript');
    const logoutButton = document.getElementById('logout');
    const serverStatusIndicator = document.getElementById('serverStatus');
    const calibrateButton = document.getElementById('calibrateBoard');
    const columnButtons = document.querySelectorAll('.column-btn');

    // Load settings from storage
    chrome.storage.local.get(['username', 'isScriptEnabled'], (data) => {
        if (data.username) {
            usernameInput.value = data.username;
        }
        
        // Toggle Script Button
        const isScriptEnabled = data.isScriptEnabled !== undefined ? data.isScriptEnabled : true;
        updateScriptToggleButton(isScriptEnabled);
    });

    // Save username to storage
    saveUsernameButton.addEventListener('click', () => {
        const username = usernameInput.value;
        chrome.storage.local.set({ 'username': username }, () => {
            showMessage('Username saved!');
        });
    });

    // Toggle Script setting
    toggleScriptButton.addEventListener('click', () => {
        chrome.storage.local.get('isScriptEnabled', (data) => {
            const isScriptEnabled = !data.isScriptEnabled;
            chrome.storage.local.set({ 'isScriptEnabled': isScriptEnabled }, () => {
                updateScriptToggleButton(isScriptEnabled);
                
                // Send message to content.js
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        type: "toggleScript", 
                        isScriptEnabled 
                    });
                });
            });
        });
    });

    // Logout and clear username
    logoutButton.addEventListener('click', () => {
        chrome.storage.local.set({ 'username': '' }, () => {
            usernameInput.value = '';
            showMessage('Logged out!');
        });
    });

    // Calibrate board button
    calibrateButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: "calibrateBoard" }, (response) => {
                if (response && response.success) {
                    showMessage('Calibration started. Please switch to the Python application window.');
                } else {
                    showMessage('Error: ' + (response ? response.error : 'Python server not connected'));
                }
            });
        });
    });

    // Column click buttons
    columnButtons.forEach(button => {
        button.addEventListener('click', () => {
            const column = parseInt(button.dataset.column);
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    type: "clickColumn", 
                    column: column 
                }, (response) => {
                    if (response && response.success) {
                        showMessage(`Clicked column ${column}`);
                    } else {
                        showMessage('Error: ' + (response ? response.error : 'Python server not connected'));
                    }
                });
            });
        });
    });

    // Check server status on popup open
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: "getServerStatus" }, (response) => {
            if (response) {
                updateServerStatus(response.isAvailable, response.isCalibrated);
            }
        });
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "serverStatus") {
            updateServerStatus(message.isAvailable, message.isCalibrated);
        } else if (message.type === "calibrationResult") {
            if (message.success) {
                showMessage('Calibration request sent successfully');
            } else {
                showMessage('Calibration error: ' + message.error);
            }
        } else if (message.type === "clickResult") {
            if (message.success) {
                // No need to show message for successful clicks
            } else {
                showMessage('Click error: ' + message.error);
            }
        }
    });

    // Helper function to update script toggle button
    function updateScriptToggleButton(isEnabled) {
        toggleScriptButton.textContent = `Script: ${isEnabled ? 'Enabled' : 'Disabled'}`;
        toggleScriptButton.style.backgroundColor = isEnabled ? 'green' : 'red';
        toggleScriptButton.style.color = 'white';
    }

    // Helper function to update server status indicator
    function updateServerStatus(isAvailable, isCalibrated) {
        if (isAvailable) {
            if (isCalibrated) {
                serverStatusIndicator.textContent = 'Server: Connected & Calibrated';
                serverStatusIndicator.style.backgroundColor = '#28a745'; // Green
            } else {
                serverStatusIndicator.textContent = 'Server: Connected (Not Calibrated)';
                serverStatusIndicator.style.backgroundColor = '#ffc107'; // Yellow
            }
            calibrateButton.disabled = false;
            columnButtons.forEach(btn => btn.disabled = false);
        } else {
            serverStatusIndicator.textContent = 'Server: Disconnected';
            serverStatusIndicator.style.backgroundColor = '#dc3545'; // Red
            calibrateButton.disabled = true;
            columnButtons.forEach(btn => btn.disabled = true);
        }
    }

    // Helper function to show temporary messages
    function showMessage(message) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
});
