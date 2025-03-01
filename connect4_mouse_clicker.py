import pyautogui
import time
import json
import os
import sys
from pynput import mouse
import threading
import tkinter as tk
from tkinter import ttk, messagebox

class Connect4MouseClicker:
    def __init__(self):
        self.column_positions = []  # Will store x coordinates for each column
        self.board_top = 0          # Y coordinate of the top of the board
        self.board_bottom = 0       # Y coordinate of the bottom of the board
        self.calibrated = False
        self.running = False
        self.setup_gui()
        
    def setup_gui(self):
        """Set up the GUI interface"""
        self.root = tk.Tk()
        self.root.title("Connect 4 Mouse Clicker")
        self.root.geometry("400x300")
        self.root.resizable(False, False)
        
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Status label
        self.status_var = tk.StringVar(value="Not calibrated")
        status_label = ttk.Label(main_frame, textvariable=self.status_var, font=("Arial", 12))
        status_label.pack(pady=10)
        
        # Calibration button
        calibrate_btn = ttk.Button(main_frame, text="Calibrate Board", command=self.start_calibration)
        calibrate_btn.pack(pady=5, fill=tk.X)
        
        # Save/Load calibration
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(pady=5, fill=tk.X)
        
        save_btn = ttk.Button(btn_frame, text="Save Calibration", command=self.save_calibration)
        save_btn.pack(side=tk.LEFT, padx=5, expand=True, fill=tk.X)
        
        load_btn = ttk.Button(btn_frame, text="Load Calibration", command=self.load_calibration)
        load_btn.pack(side=tk.RIGHT, padx=5, expand=True, fill=tk.X)
        
        # Column buttons frame
        col_frame = ttk.LabelFrame(main_frame, text="Click Column")
        col_frame.pack(pady=10, fill=tk.X)
        
        # Column buttons
        btn_frame = ttk.Frame(col_frame)
        btn_frame.pack(pady=5, fill=tk.X)
        
        for i in range(7):
            col_btn = ttk.Button(btn_frame, text=str(i+1), 
                                command=lambda col=i: self.click_column(col))
            col_btn.pack(side=tk.LEFT, padx=2, expand=True)
        
        # Instructions
        instructions = ttk.Label(main_frame, text="1. Click 'Calibrate Board'\n"
                                               "2. Click on the bottom cell of each column (left to right)\n"
                                               "3. After calibration, use the column buttons to click", 
                                justify=tk.LEFT)
        instructions.pack(pady=10, anchor=tk.W)
        
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
    def start_calibration(self):
        """Start the calibration process"""
        self.column_positions = []
        self.calibrated = False
        self.status_var.set("Calibrating: Click bottom cell of column 1")
        
        # Start a listener for mouse clicks
        self.listener = mouse.Listener(on_click=self.on_calibration_click)
        self.listener.start()
    
    def on_calibration_click(self, x, y, button, pressed):
        """Handle mouse clicks during calibration"""
        if not pressed or button != mouse.Button.left:
            return
        
        # Record the position
        self.column_positions.append(x)
        
        # If this is the first click, record the y-coordinate as the bottom of the board
        if len(self.column_positions) == 1:
            self.board_bottom = y
        
        # If we have all 7 columns, stop calibration
        if len(self.column_positions) >= 7:
            self.board_top = y - 300  # Approximate the top of the board
            self.calibrated = True
            self.status_var.set("Calibration complete!")
            self.listener.stop()
            return False
        else:
            self.status_var.set(f"Calibrating: Click bottom cell of column {len(self.column_positions) + 1}")
    
    def click_column(self, column_index):
        """Click on the specified column"""
        if not self.calibrated:
            messagebox.showerror("Error", "Please calibrate the board first")
            return
        
        if 0 <= column_index < len(self.column_positions):
            x = self.column_positions[column_index]
            y = self.board_bottom - 30  # Click a bit above the bottom cell
            
            # Teleport mouse and click
            current_pos = pyautogui.position()
            pyautogui.click(x, y)
            # Return mouse to original position if desired
            # pyautogui.moveTo(current_pos.x, current_pos.y)
            
            self.status_var.set(f"Clicked column {column_index + 1}")
        else:
            messagebox.showerror("Error", "Invalid column index")
    
    def save_calibration(self):
        """Save calibration data to a file"""
        if not self.calibrated:
            messagebox.showerror("Error", "Please calibrate the board first")
            return
            
        calibration_data = {
            "column_positions": self.column_positions,
            "board_top": self.board_top,
            "board_bottom": self.board_bottom
        }
        
        try:
            with open("connect4_calibration.json", "w") as f:
                json.dump(calibration_data, f)
            messagebox.showinfo("Success", "Calibration saved successfully")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save calibration: {str(e)}")
    
    def load_calibration(self):
        """Load calibration data from a file"""
        try:
            with open("connect4_calibration.json", "r") as f:
                calibration_data = json.load(f)
                
            self.column_positions = calibration_data["column_positions"]
            self.board_top = calibration_data["board_top"]
            self.board_bottom = calibration_data["board_bottom"]
            self.calibrated = True
            
            self.status_var.set("Calibration loaded successfully")
        except FileNotFoundError:
            messagebox.showerror("Error", "Calibration file not found")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load calibration: {str(e)}")
    
    def on_close(self):
        """Handle window close event"""
        if hasattr(self, 'listener') and self.listener.is_alive():
            self.listener.stop()
        self.root.destroy()
    
    def run(self):
        """Run the application"""
        self.root.mainloop()

# Extension integration functions
def connect_to_extension():
    """
    This function would handle communication with the Chrome extension.
    For now, it's a placeholder for future implementation.
    
    Potential approaches:
    1. Native messaging (requires extension modifications)
    2. Local web server that the extension can communicate with
    3. Shared file that both the extension and this script can read/write
    """
    pass

if __name__ == "__main__":
    # Check if pyautogui is installed
    try:
        import pyautogui
    except ImportError:
        print("Error: pyautogui is not installed. Please install it using:")
        print("pip install pyautogui")
        sys.exit(1)
        
    # Check if pynput is installed
    try:
        import pynput
    except ImportError:
        print("Error: pynput is not installed. Please install it using:")
        print("pip install pynput")
        sys.exit(1)
    
    app = Connect4MouseClicker()
    app.run() 