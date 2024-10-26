// ==UserScript==
// @name         Connect 4 AI for papergames
// @namespace    https://github.com/longkidkoolstar
// @version      0.1.1
// @description  Adds an AI player to Connect 4 on papergames.io
// @author       longkidkoolstar
// @icon         https://th.bing.com/th/id/R.2ea02f33df030351e0ea9bd6df0db744?rik=Pnmqtc4WLvL0ow&pid=ImgRaw&r=0
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @match        https://papergames.io/*
// @license      none
// @grant        GM.xmlHttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==


(async function() {
    'use strict';

    var username = await GM.getValue('username');

    if (!username) {
        username = prompt('Please enter your Papergames username (case-sensitive):');
       await GM.setValue('username', username);
    }

    var player;
    var prevChronometerValue = '';
    var moveHistory = [];
    var lastBoardState = [];
    var aiTurn = false;
    var processingMove = false;
    var moveCooldown = false;

    function resetVariables() {
        player = undefined;
        prevChronometerValue = '';
        moveHistory = [];
        lastBoardState = [];
        aiTurn = false;
        processingMove = false;
        moveCooldown = false;
        console.log("Variables reset to default states");
    }
    function checkForResetButtons() {
        var playOnlineButton = document.querySelector("button.btn-secondary.flex-grow-1");
        var leaveRoomButton = document.querySelector("button.btn-light.ng-tns-c189-7");
        var customResetButton = document.querySelector("button.btn.btn-outline-dark.ng-tns-c497539356-18.ng-star-inserted");
    
        if (playOnlineButton || leaveRoomButton || customResetButton) {
            resetVariables();
        }
    }

    function updateBoard() {
        var profileOpeners = document.querySelectorAll(".text-truncate.cursor-pointer");
        var profileOpener = Array.from(profileOpeners).find(opener => opener.textContent.trim() === username);

        var chronometer = document.querySelector("app-chronometer");
        var numberElement;

        if (profileOpener) {
            var profileParent = profileOpener.parentNode;
            numberElement = profileOpener.parentNode.querySelectorAll("span")[4];

            var profileOpenerParent = profileOpener.parentNode.parentNode;
            var svgElementDark = profileOpenerParent.querySelector("circle.circle-dark");
            var svgElementLight = profileOpenerParent.querySelector("circle.circle-light");

            if (svgElementDark) {
                player = 'R';
            } else if (svgElementLight) {
                player = 'Y';
            }
        }

        var currentElement = chronometer || numberElement;
        if (currentElement && currentElement.textContent !== prevChronometerValue && profileOpener) {
            prevChronometerValue = currentElement.textContent;
            console.log("AI's turn detected. Waiting 2 seconds before making API move...");
            aiTurn = true;
            setTimeout(() => {
                if (!moveCooldown) {
                    console.log("Making API move...");
                    makeAPIMove();
                }
            }, 1500);
        } else {
            aiTurn = false;
            console.log("Waiting for AI's turn...");
        }
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
    
    function simulateCellClick(column) {
        console.log(`Attempting to click on column ${column}`);
        const boardContainer = document.querySelector(".grid.size6x7");
        if (!boardContainer) {
            console.error("Board container not found");
            return;
        }
    
        for (let row = 5; row >= 0; row--) {
            const cellSelector = `.cell-${row}-${column}`;
            const cell = boardContainer.querySelector(cellSelector);
            if (cell && cell.classList.contains('selectable')) {
                console.log(`Found selectable cell at row ${row}, column ${column}`);
                setTimeout(() => {
                    console.log(`Dispatching click event on row ${row}, column ${column}`);
                    var event = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                    });
                    cell.dispatchEvent(event);
                    console.log(`Click event dispatched on row ${row}, column ${column}`);
                    processingMove = false; // Move processed, reset flag
                    moveCooldown = true; // Set cooldown
                    setTimeout(() => moveCooldown = false, 2000); // Reset cooldown after 2 seconds
                }, 1000);
                return;
            }
        }
        console.log(`No selectable cell found in column ${column}`);
        processingMove = false; // No valid move found, reset flag
    }

    function makeAPIMove() {
        if (!aiTurn || processingMove) return; // Ensure AI turn and not processing another move
        processingMove = true; // Set flag to indicate move processing

        detectNewMove();
        console.log("Move history:", moveHistory);

        let pos = moveHistory.join("");
        console.log("API position string:", pos);
        console.log("Move count:", pos.length);

        const apiUrl = `https://connect4.gamesolver.org/solve?pos=${pos}`;
        console.log("API URL:", apiUrl);

        GM.xmlHttpRequest({
            method: "GET",
            url: apiUrl,
            onload: function(response) {
                console.log("API response received:", response.responseText);
                const data = JSON.parse(response.responseText);
                console.log("Parsed API data:", data);
                const scores = data.score;
                console.log("Move scores:", scores);

                let bestMove = -1;
                let bestScore = -Infinity;
                for (let i = 0; i < scores.length; i++) {
                    if (scores[i] !== 100 && scores[i] > bestScore) {
                        bestScore = scores[i];
                        bestMove = i;
                    }
                }

                console.log("Best move (column):", bestMove);
                if (bestMove !== -1) {
                    simulateCellClick(bestMove);
                } else {
                    console.log("No valid moves available");
                    processingMove = false; // No valid move, reset flag
                }
            },
            onerror: function(error) {
                console.error("API request failed:", error);
                processingMove = false; // API request failed, reset flag
            }
        });
    }

    function initAITurn() {
        console.log("Player: ", player);
        const boardState = getBoardState();
        console.log("Board State: ", boardState);

        if (!player) {
            for (let row of boardState) {
                for (let cell of row) {
                    if (cell !== "E") {
                        player = cell === "R" ? "Y" : "R";
                        break;
                    }
                }
                if (player) break;
            }
        }
    }

function logout() {
    localStorage.removeItem('username');
    location.reload();
}

function createLogoutButton() {
    $('<button>')
        .text('Logout')
        .addClass('btn btn-secondary mb-2 ng-star-inserted')
        .css({
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '9999',
            color: 'white'
        })
        .on('click', logout)
        .on('mouseover', function() { $(this).css('opacity', '0.5'); })
        .on('mouseout', function() { $(this).css('opacity', '1'); })
        .appendTo('body');
}

$(function() {
    createLogoutButton();

    var $dropdownContainer = $('<div>')
        .css({
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: '9998',
            backgroundColor: '#1b2837',
            border: '1px solid #18bc9c',
            borderRadius: '5px'
        })
        .appendTo('body');

    var $toggleButton = $('<button>')
        .text('Settings')
        .addClass('btn btn-secondary mb-2 ng-star-inserted')
        .css({
            padding: '5px 10px',
            border: 'none',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '5px'
        })
        .on('mouseover', function() { $(this).css('opacity', '0.5'); })
        .on('mouseout', function() { $(this).css('opacity', '1'); })
        .appendTo($dropdownContainer);

    var $dropdownContent = $('<div>')
        .css({
            display: 'none',
            padding: '8px'
        })
        .appendTo($dropdownContainer);

    var $autoQueueTab = $('<div>')
        .text('Auto Queue')
        .css({
            padding: '5px 0',
            cursor: 'pointer'
        })
        .appendTo($dropdownContent);

    var $autoQueueSettings = $('<div>')
        .css('padding', '10px')
        .appendTo($dropdownContent);

    var isAutoQueueOn = false;

    var $autoQueueToggleButton = $('<button>')
        .text('Auto Queue Off')
        .addClass('btn btn-secondary mb-2 ng-star-inserted')
        .css({
            marginTop: '10px',
            backgroundColor: 'red',
            color: 'white'
        })
        .on('click', toggleAutoQueue)
        .appendTo($autoQueueSettings);

    function toggleAutoQueue() {
        isAutoQueueOn = !isAutoQueueOn;
        localStorage.setItem('isToggled', isAutoQueueOn);
        $autoQueueToggleButton.text(isAutoQueueOn ? 'Auto Queue On' : 'Auto Queue Off')
            .css('backgroundColor', isAutoQueueOn ? 'green' : 'red');
    }

    function clickLeaveRoomButton() {
        $("button.btn-light.ng-tns-c189-7").click();
    }

    function clickPlayOnlineButton() {
        $("button.btn-secondary.flex-grow-1").click();
    }

    function checkButtonsPeriodically() {
        if (isAutoQueueOn) {
            clickLeaveRoomButton();
            clickPlayOnlineButton();
        }
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
});

//---GUI



    setInterval(function() {
        updateBoard();
        initAITurn();
    }, 1000);

//Checking If the game is over so it can reset variables
setInterval(function() {
    checkForResetButtons();
}, 500);


    function displayAIBoard() {
        const boardState = getBoardState();
        console.log("Current board state:");
        boardState.forEach(row => {
            console.log(row.join(" | "));
        });
    }

    setInterval(displayAIBoard, 1000);
    setInterval(detectNewMove, 100);

    console.log("Connect 4 AI script loaded and running");
})();
