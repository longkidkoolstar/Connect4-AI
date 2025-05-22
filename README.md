# Connect 4 Board Evaluation with Mouse Control

This project enhances the Connect 4 Board Evaluation Chrome extension for papergames.io with a Python-based mouse controller. This allows the extension to physically click on the game board when JavaScript click events are blocked by the website.

## Components

1. **Chrome Extension/UserScript**: Evaluates Connect 4 board positions and displays the best moves
2. **Python Mouse Controller**: Controls the mouse to click on the game board
3. **Python Bridge**: Allows communication between the extension/UserScript and the Python controller

## Setup Instructions

### Prerequisites

- Google Chrome browser
- Python 3.6 or higher
- pip (Python package installer)

### Step 1: Install Required Python Packages

```bash
pip install pyautogui pynput
```

### Step 2: Install the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top-right corner)
3. **IMPORTANT**: Run the `clean_extension.bat` file before loading the extension to remove any `__pycache__` directories
4. Click "Load unpacked" and select the extension folder

Note: The extension isn't required for the UserScript to work. The UserScript can also click through the bridge Python script directly.

### Step 3: Run the Python Bridge

1. Open a terminal/command prompt
2. Navigate to the folder containing the Python scripts
3. Run the Python bridge:

```bash
python connect4_extension_bridge.py
```

This will start both the mouse controller GUI and the Python bridge.

## Usage Instructions

### Calibrating the Mouse Controller

1. Start a Connect 4 game on papergames.io
2. In the Python GUI, click the "Calibrate Board" button
3. Click on the bottom cell of each column from left to right (7 clicks total)
4. After calibration is complete, you can save it for future use

### Playing the Game

1. The extension will automatically evaluate the board after each move
2. When you or the extension tries to make a move:
   - First, it will try using JavaScript click events
   - If that fails, it will send the command to the Python controller
   - The Python controller will move the mouse to the correct column and click

### Keyboard Shortcuts

The extension supports keyboard controls for easier gameplay:

- **1-7 keys**: Click on columns 1-7 directly
- **A key**: Toggle Auto-Play on/off
- **K key**: Toggle Keyboard Controls on/off

You can enable/disable keyboard controls using the "Keyboard Controls" button in the UI.

### Saving/Loading Calibration

- Click "Save Calibration" to save the current calibration to a file
- Click "Load Calibration" to load a previously saved calibration



## Troubleshooting

### Python Bridge Not Connecting

- Make sure the Python bridge script is running
- Check that port 8765 is not blocked by a firewall
- Restart the Python script if needed

### Clicks Not Working

- Re-calibrate the board
- Make sure the game window is visible and not minimized
- Ensure the browser window hasn't been moved since calibration

### Extension Loading Error: "__pycache__"

If you see an error like "Cannot load extension with file or directory name __pycache__":

1. Run the included `clean_extension.bat` file to remove the `__pycache__` directory
2. Alternatively, manually delete the `__pycache__` directory before loading the extension
3. This directory is created by Python when running `.py` files, but Chrome doesn't allow directories starting with underscores

## Security Note

This tool uses mouse automation which can be potentially dangerous if misused. The Python script only moves the mouse when explicitly instructed to do so by the extension, and only after proper calibration.

## License

This project is for educational purposes only. Use at your own risk.

