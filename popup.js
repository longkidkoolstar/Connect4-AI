document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const saveUsernameButton = document.getElementById('saveUsername');
    const toggleAutoQueueButton = document.getElementById('toggleAutoQueue');
    const toggleScriptButton = document.getElementById('toggleScript'); // New toggle button
    const logoutButton = document.getElementById('logout');
    const scoresContainer = document.getElementById('scores');

    // Load settings from storage
    chrome.storage.local.get(['username', 'isAutoQueueOn', 'isScriptEnabled'], (data) => {
        if (data.username) {
            usernameInput.value = data.username;
        }
        toggleAutoQueueButton.textContent = `Auto Queue: ${data.isAutoQueueOn ? 'On' : 'Off'}`;
        toggleAutoQueueButton.style.backgroundColor = data.isAutoQueueOn ? 'green' : 'red';
        
        // Toggle Script Button
        toggleScriptButton.textContent = `Script: ${data.isScriptEnabled ? 'Enabled' : 'Disabled'}`;
        toggleScriptButton.style.backgroundColor = data.isScriptEnabled ? 'green' : 'red';
    });

    // Save username to storage
    saveUsernameButton.addEventListener('click', () => {
        const username = usernameInput.value;
        chrome.storage.local.set({ 'username': username }, () => {
            alert('Username saved!');
        });
    });

    // Toggle Auto Queue setting
    toggleAutoQueueButton.addEventListener('click', () => {
        chrome.storage.local.get('isAutoQueueOn', (data) => {
            const isAutoQueueOn = !data.isAutoQueueOn;
            chrome.storage.local.set({ 'isAutoQueueOn': isAutoQueueOn }, () => {
                toggleAutoQueueButton.textContent = `Auto Queue: ${isAutoQueueOn ? 'On' : 'Off'}`;
                toggleAutoQueueButton.style.backgroundColor = isAutoQueueOn ? 'green' : 'red';
                
                // Send message to content.js
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "toggleAutoQueue", isAutoQueueOn });
                });
            });
        });
    });

    // Toggle Script setting
    toggleScriptButton.addEventListener('click', () => {
        chrome.storage.local.get('isScriptEnabled', (data) => {
            const isScriptEnabled = !data.isScriptEnabled;
            chrome.storage.local.set({ 'isScriptEnabled': isScriptEnabled }, () => {
                toggleScriptButton.textContent = `Script: ${isScriptEnabled ? 'Enabled' : 'Disabled'}`;
                toggleScriptButton.style.backgroundColor = isScriptEnabled ? 'green' : 'red';
                
                // Send message to content.js
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { type: "toggleScript", isScriptEnabled });
                });
            });
        });
    });

    // Logout and clear username
    logoutButton.addEventListener('click', () => {
        chrome.storage.local.set({ 'username': '' }, () => {
            usernameInput.value = '';
            alert('Logged out!');
        });
    });

    // Receive scores from content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'updateScores') {
            scoresContainer.innerHTML = ''; // Clear old scores
            message.scores.forEach(score => {
                const scoreDiv = document.createElement('div');
                scoreDiv.textContent = score;
                scoreDiv.style.color = score > 0 ? 'green' : (score < 0 ? 'red' : 'black');
                scoresContainer.appendChild(scoreDiv);
            });
        }
    });
});
