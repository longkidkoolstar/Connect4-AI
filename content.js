(async function() {
    'use strict';

    // Initialize variables
    let username = await getUsername();
    let isScriptEnabled = true;
    const PYTHON_SERVER_URL = 'http://localhost:8765';
    let pythonServerAvailable = false;
    let serverCheckRetryCount = 0;
    const SERVER_CHECK_INTERVAL = 10000; // How often to check Python server status (ms)
    const SERVER_RETRY_INTERVAL = 3000; // How often to retry connecting to the server when disconnected (ms)

    // Load script enable state from storage
    chrome.storage.local.get('isScriptEnabled', (data) => {
        isScriptEnabled = data.isScriptEnabled !== undefined ? data.isScriptEnabled : true; // Default to true
        if (!isScriptEnabled) {
            console.log("Script is disabled.");
            return; // Exit if the script is disabled
        }
    });

    // Listener to handle messages from popup.js
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "toggleScript") {
            isScriptEnabled = message.isScriptEnabled;
            if (!isScriptEnabled) {
                console.log("Script disabled.");
                // Add any cleanup code if necessary
            }
        } else if (message.type === "getServerStatus") {
            sendResponse({ 
                isAvailable: pythonServerAvailable 
            });
            return true; // Keep the message channel open for the async response
        } else if (message.type === "calibrateBoard") {
            if (pythonServerAvailable) {
                sendCalibrationRequest();
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: "Python server is not connected" });
            }
            return true;
        } else if (message.type === "clickColumn") {
            if (pythonServerAvailable) {
                sendClickRequestToPython(message.column - 1); // Convert to 0-indexed
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: "Python server is not connected" });
            }
            return true;
        }
    });

    // If username is not set, prompt the user and save it to storage
    if (!username) {
        username = prompt('Please enter your Papergames username (case-sensitive):');
        if (username) {
            setUsername(username);  // Function to set username in storage
        }
    }

    // Function to retrieve the username from storage
    async function getUsername() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['username'], (result) => {
                resolve(result.username || null);
            });
        });
    }

    // Function to save the username in storage
    function setUsername(username) {
        chrome.storage.local.set({ 'username': username });
    }

    // Function to send click request to Python server
    function sendClickRequestToPython(column) {
        fetch(`${PYTHON_SERVER_URL}/api/click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ column: column }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Python click response:', data);
            // Send message to popup about successful click
            chrome.runtime.sendMessage({ 
                type: "clickResult", 
                success: true 
            });
        })
        .catch(error => {
            console.error('Error communicating with Python server:', error);
            pythonServerAvailable = false;
            // Send message to popup about failed click
            chrome.runtime.sendMessage({ 
                type: "clickResult", 
                success: false,
                error: error.message
            });
            // Schedule a retry to check server status
            setTimeout(checkPythonServerStatus, SERVER_RETRY_INTERVAL);
        });
    }

    // Function to send calibration request to Python server
    function sendCalibrationRequest() {
        fetch(`${PYTHON_SERVER_URL}/api/calibrate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ start: true }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Calibration request response:', data);
            // Send message to popup about calibration status
            chrome.runtime.sendMessage({ 
                type: "calibrationResult", 
                success: true,
                data: data
            });
        })
        .catch(error => {
            console.error('Error sending calibration request:', error);
            // Send message to popup about failed calibration
            chrome.runtime.sendMessage({ 
                type: "calibrationResult", 
                success: false,
                error: error.message
            });
        });
    }

    // Function to check if Python server is running
    function checkPythonServerStatus() {
        if (!isScriptEnabled) return;
        
        fetch(`${PYTHON_SERVER_URL}/api/status`)
            .then(response => response.json())
            .then(data => {
                console.log('Python server status:', data);
                pythonServerAvailable = true;
                serverCheckRetryCount = 0;
                
                // Send message to popup about server status
                chrome.runtime.sendMessage({ 
                    type: "serverStatus", 
                    isAvailable: true,
                    isCalibrated: data.calibrated
                });
            })
            .catch(error => {
                console.error('Python server not available:', error);
                pythonServerAvailable = false;
                
                // Send message to popup about server status
                chrome.runtime.sendMessage({ 
                    type: "serverStatus", 
                    isAvailable: false
                });
                
                // Schedule a retry with exponential backoff
                scheduleServerRetry();
            });
    }
    
    // Schedule a retry to check server status with exponential backoff
    function scheduleServerRetry() {
        serverCheckRetryCount++;
        const delay = Math.min(SERVER_RETRY_INTERVAL * Math.pow(1.5, serverCheckRetryCount - 1), 30000);
        console.log(`Scheduling server check retry in ${delay}ms (attempt ${serverCheckRetryCount})`);
        setTimeout(checkPythonServerStatus, delay);
    }

    // Function to logout
    function logout() {
        chrome.storage.local.set({ 'username': '' }, () => {
            location.reload();
        });
    }

    // Check Python server status periodically
    setInterval(checkPythonServerStatus, SERVER_CHECK_INTERVAL);
    
    // Initial server status check
    checkPythonServerStatus();

    console.log("Connect 4 Extension Bridge loaded and running");
})();