# Connect 4 Board Evaluation with Mouse Control

This project enhances the Connect 4 Board Evaluation Chrome extension for papergames.io with a Python-based mouse controller. This allows the extension to physically click on the game board when JavaScript click events are blocked by the website.

## Components

1. **Chrome Extension**: Evaluates Connect 4 board positions and displays the best moves
2. **Python Mouse Controller**: Controls the mouse to click on the game board
3. **Bridge Server**: Allows communication between the Chrome extension and the Python controller

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

### Step 3: Run the Python Controller

1. Open a terminal/command prompt
2. Navigate to the folder containing the Python scripts
3. Run the bridge server:

```bash
python connect4_extension_bridge.py
```

This will start both the mouse controller GUI and the bridge server.

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

## Hosting the Python Server

If you want to host the Python server remotely, here are some free options:

### 1. PythonAnywhere (Free Tier)

- Free hosting for Python applications
- Includes a web-based console and file editor
- Limited CPU time and bandwidth on free tier
- Setup: [PythonAnywhere](https://www.pythonanywhere.com/)

### 2. Heroku (Free Tier)

- Free tier for small applications
- Supports Python applications
- Note: Free tier has limitations and may sleep after 30 minutes of inactivity
- Setup: [Heroku](https://www.heroku.com/)

### 3. Google Cloud Run (Free Tier)

- Serverless platform with generous free tier
- Pay only for the time your code runs
- Setup: [Google Cloud Run](https://cloud.google.com/run)

### 4. AWS Lambda + API Gateway (Free Tier)

- Serverless function hosting
- Free tier includes 1M requests per month
- Setup: [AWS Lambda](https://aws.amazon.com/lambda/)

### 5. Replit (Free Tier)

- Online IDE with hosting capabilities
- Good for Python applications
- Setup: [Replit](https://replit.com/)

**Important Note**: For remote hosting, you'll need to modify the mouse controller to work over a network connection, as direct mouse control requires the server to be running on the same machine as the browser.

## Troubleshooting

### Python Server Not Connecting

- Make sure the Python server is running
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
 
