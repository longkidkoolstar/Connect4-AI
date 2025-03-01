(async function() {
    'use strict';

 // Initialize variables
 let username = await getUsername();
 let moveHistory = [];
 let lastBoardState = [];
 let isScriptEnabled = true; // New variable to track script enable state

 // Load script enable state from storage
 chrome.storage.local.get('isScriptEnabled', (data) => {
     isScriptEnabled = data.isScriptEnabled !== undefined ? data.isScriptEnabled : true; // Default to true
     if (!isScriptEnabled) {
         console.log("Script is disabled.");
         return; // Exit if the script is disabled
     }
 });

 // Listener to handle messages from popup.js
 chrome.runtime.onMessage.addListener((message) => {
     if (message.type === "toggleAutoQueue") {
         isAutoQueueOn = message.isAutoQueueOn;
     } else if (message.type === "toggleScript") {
         isScriptEnabled = message.isScriptEnabled;
         if (!isScriptEnabled) {
             console.log("Script disabled.");
             // Add any cleanup code if necessary
         }
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

    function getBoardState() {
        const boardContainer = document.querySelector(".grid.size6x7");
        if (!boardContainer) {
            console.error("Board container not found");
            return [];
        }
    
        let boardState = [];
    
        // Iterate over cells in a more flexible way
        for (let row = 1; row <= 6; row++) {
            let rowState = [];
            for (let col = 1; col <= 7; col++) {
                // Use a selector that matches the class names correctly
                const cellSelector = `.grid-item.cell-${row}-${col}`;
                const cell = boardContainer.querySelector(cellSelector);
                if (cell) {
                    // Check the circle class names to determine the cell's state
                    const circle = cell.querySelector("circle");
                    if (circle) {
                        if (circle.classList.contains("circle-dark")) {
                            rowState.push("R");
                        } else if (circle.classList.contains("circle-light")) {
                            rowState.push("Y");
                        } else {
                            rowState.push("E");
                        }
                    } else {
                        rowState.push("E");
                    }
                } else {
                    console.error(`Cell not found: ${cellSelector}`);
                    rowState.push("E");
                }
            }
            boardState.push(rowState);
        }
    
        return boardState;
    }
    
    function detectNewMove() {
        const currentBoardState = getBoardState();
        let newMove = false;
    
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                if (lastBoardState[row] && lastBoardState[row][col] === 'E' && currentBoardState[row][col] !== 'E') {
                    moveHistory.push(col + 1);
                    newMove = true;
                }
            }
        }
    
        lastBoardState = currentBoardState;
        return newMove;
    }
    

    async function getAPIEvaluation() {
        if (!detectNewMove()) return;
    
        let pos = moveHistory.join("");
        const apiUrl = `https://connect4.gamesolver.org/solve?pos=${pos}`;
    
        try {
            const response = await fetch(apiUrl, { method: "GET" });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
            const data = await response.json();
            displayEvaluations(data.score);
        } catch (error) {
            console.error("API request failed:", error);
        }
    }
    

function displayEvaluations(scores) {
    const boardContainer = document.querySelector(".grid.size6x7");
    let evalContainer = document.querySelector("#evaluation-container");

    if (!evalContainer) {
        evalContainer = document.createElement("div");
        evalContainer.id = "evaluation-container";
        evalContainer.style.display = "flex";
        evalContainer.style.justifyContent = "space-around";
        evalContainer.style.marginTop = "10px";
        boardContainer.parentNode.insertBefore(evalContainer, boardContainer.nextSibling);
    }

    // Clear existing evaluation cells
    evalContainer.innerHTML = '';

    scores.forEach((score, index) => {
        const evalCell = document.createElement("div");
        evalCell.textContent = score;
        evalCell.style.textAlign = 'center';
        evalCell.style.fontWeight = 'bold';
        evalCell.style.color = score > 0 ? 'green' : (score < 0 ? 'red' : 'black');
        evalCell.style.flexGrow = '1';
        evalCell.style.padding = '5px';
        evalContainer.appendChild(evalCell);
    });
}

function simulateCellClick(column) {
    console.log(`Attempting to click on column ${column}`);
    
    // First try the JavaScript approach
    const boardContainer = document.querySelector(".grid.size6x7");
    if (!boardContainer) {
        console.error("Board container not found");
        return;
    }

    // Try to find a selectable cell in the column
    let foundSelectableCell = false;
    for (let row = 5; row >= 0; row--) {
        const cellSelector = `.cell-${row}-${column}`;
        const cell = boardContainer.querySelector(cellSelector);
        if (cell && cell.classList.contains('selectable')) {
            console.log(`Found selectable cell at row ${row}, column ${column}`);
            console.log(`Dispatching click event on row ${row}, column ${column}`);
            var event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            });
            cell.dispatchEvent(event);
            console.log(`Click event dispatched on row ${row}, column ${column}`);
            foundSelectableCell = true;
            break;
        }
    }
    
    // If JavaScript click failed, try using the Python server
    if (!foundSelectableCell) {
        console.log("No selectable cell found, trying Python mouse clicker");
        sendClickRequestToPython(column - 1); // Convert to 0-indexed for Python
    }
}

// Function to send click request to Python server
function sendClickRequestToPython(column) {
    fetch('http://localhost:8765/api/click', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ column: column }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Python click response:', data);
    })
    .catch(error => {
        console.error('Error communicating with Python server:', error);
    });
}

// Function to check if Python server is running
function checkPythonServerStatus() {
    fetch('http://localhost:8765/api/status')
        .then(response => response.json())
        .then(data => {
            console.log('Python server status:', data);
            // You could update UI here to show server status
        })
        .catch(error => {
            console.error('Python server not available:', error);
        });
}

// Check Python server status periodically
setInterval(checkPythonServerStatus, 10000);

    function resetVariables() {
        moveHistory = [];
        lastBoardState = [];
        console.log("Variables reset to default states");
    }
    function checkForResetButtons() {
        var playOnlineButton = document.querySelector("body > app-root > app-navigation > div > div.d-flex.flex-column.h-100.w-100 > main > app-game-landing > div > div > div > div.col-12.col-lg-9.dashboard > div.card.area-buttons.d-flex.justify-content-center.align-items-center.flex-column > button.btn.btn-secondary.btn-lg.position-relative");
        var leaveRoomButton = document.querySelector("button.btn-light.ng-tns-c189-7");
        var customResetButton = document.querySelector("button.btn.btn-outline-dark.ng-tns-c497539356-18.ng-star-inserted");
    
        if (playOnlineButton || leaveRoomButton || customResetButton) {
            resetVariables();
        }
        if (window.location.href === "https://papergames.io/en/match-history" ||
            window.location.href === "https://papergames.io/en/friends" ||
            window.location.href === "https://papergames.io/en/chat") {
            resetVariables();
        }
    }

    //Checking If the game is over so it can reset variables
setInterval(function() {
    checkForResetButtons();
}, 500);
setInterval(() => {
    if (isScriptEnabled) {
        getAPIEvaluation(); // or any other functions you want to call periodically
    }
}, 10);

    console.log("Modified Connect 4 script loaded and running");



    function logout() {
        chrome.storage.local.set({ 'username': '' }, () => {
            location.reload();
        });
    }
    



        let isAutoQueueOn = false;

        // Listener to handle messages from popup.js
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === "toggleAutoQueue") {
                isAutoQueueOn = message.isAutoQueueOn;
            }
        });
        
        // Check buttons periodically when auto queue is on
        function checkButtonsPeriodically() {
            if (isAutoQueueOn) {
                clickLeaveRoomButton();
                clickPlayOnlineButton();
            }
        }
        
        // Periodically call checkButtonsPeriodically
        setInterval(checkButtonsPeriodically, 1000);
        
        // Function to click "Leave Room" button
        function clickLeaveRoomButton() {
            document.querySelector("button.btn-light.ng-tns-c189-7")?.click();
        }
        
        // Function to click "Play Online" button
        function clickPlayOnlineButton() {
            document.querySelector("button.btn-secondary.flex-grow-1")?.click();
        }
        

    setInterval(checkButtonsPeriodically, 1000);

    let previousNumber = null;

    function trackAndClickIfDifferent() {
        const $spanElement = $('app-count-down span');
        if ($spanElement.length) {
            const number = parseInt($spanElement.text(), 10);
            if (!isNaN(number) && previousNumber !== null && number !== previousNumber && isAutoQueueOn) {
                $spanElement.click();
            }
            previousNumber = number;
        }
    }

    setInterval(trackAndClickIfDifferent, 1000);

    $toggleButton.on('click', function() {
        $dropdownContent.toggle();
    });


//---GUI
})();