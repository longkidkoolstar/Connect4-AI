import http.server
import socketserver
import json
import threading
import time
import sys
import os
from urllib.parse import parse_qs, urlparse

# Import the mouse clicker class
from connect4_mouse_clicker import Connect4MouseClicker

class ExtensionBridgeHandler(http.server.SimpleHTTPRequestHandler):
    """Handler for the HTTP requests from the Chrome extension"""
    
    def __init__(self, *args, mouse_clicker=None, **kwargs):
        self.mouse_clicker = mouse_clicker
        super().__init__(*args, **kwargs)
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def send_cors_headers(self):
        """Send CORS headers to allow cross-origin requests"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')  # 24 hours
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_url = urlparse(self.path)
        
        # Handle API endpoints
        if parsed_url.path.startswith('/api/'):
            self.handle_api(parsed_url)
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            
            # Handle different POST endpoints
            if self.path == '/api/click':
                self.handle_click(data)
            elif self.path == '/api/status':
                self.handle_status()
            elif self.path == '/api/calibrate':
                self.handle_calibrate(data)
            else:
                self.send_error(404, "Endpoint not found")
                
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
        except Exception as e:
            self.send_error(500, str(e))
    
    def handle_api(self, parsed_url):
        """Handle API GET endpoints"""
        if parsed_url.path == '/api/status':
            self.handle_status()
        else:
            self.send_error(404, "Endpoint not found")
    
    def handle_click(self, data):
        """Handle click requests from the extension"""
        if not self.mouse_clicker or not self.mouse_clicker.calibrated:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Mouse clicker not calibrated'
            }).encode())
            return
        
        # Get the column to click
        column = data.get('column')
        if column is None or not isinstance(column, int) or column < 0 or column > 6:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Invalid column. Must be an integer between 0 and 6.'
            }).encode())
            return
        
        # Click the column
        try:
            self.mouse_clicker.click_column(column)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': f'Clicked column {column + 1}'
            }).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'message': str(e)
            }).encode())
    
    def handle_calibrate(self, data):
        """Handle calibration requests from the extension"""
        if not self.mouse_clicker:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Mouse clicker not initialized'
            }).encode())
            return
        
        # Start calibration
        try:
            # Run calibration in a separate thread to not block the response
            threading.Thread(target=self.mouse_clicker.start_calibration).start()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': 'Calibration started'
            }).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'message': str(e)
            }).encode())
    
    def handle_status(self):
        """Handle status requests"""
        status = {
            'running': True,
            'calibrated': self.mouse_clicker.calibrated if self.mouse_clicker else False
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())

class ExtensionBridgeServer:
    """Server that bridges between the Chrome extension and the mouse clicker"""
    
    def __init__(self, mouse_clicker, port=8765):
        self.mouse_clicker = mouse_clicker
        self.port = port
        self.server = None
        self.server_thread = None
        self.running = False
    
    def start(self):
        """Start the server"""
        if self.running:
            print("Server is already running")
            return
        
        # Create handler with a reference to the mouse clicker
        handler = lambda *args, **kwargs: ExtensionBridgeHandler(*args, mouse_clicker=self.mouse_clicker, **kwargs)
        
        # Create and start the server
        self.server = socketserver.TCPServer(("localhost", self.port), handler)
        self.server_thread = threading.Thread(target=self.server.serve_forever)
        self.server_thread.daemon = True
        self.server_thread.start()
        self.running = True
        
        print(f"Server started on port {self.port}")
        print(f"Extension can connect to: http://localhost:{self.port}/")
        print(f"CORS support enabled for cross-origin requests")
    
    def stop(self):
        """Stop the server"""
        if not self.running:
            return
        
        self.server.shutdown()
        self.server.server_close()
        self.server_thread.join()
        self.running = False
        print("Server stopped")

if __name__ == "__main__":
    # Create the mouse clicker
    mouse_clicker = Connect4MouseClicker()
    
    # Create and start the server
    server = ExtensionBridgeServer(mouse_clicker)
    server.start()
    
    # Run the mouse clicker GUI
    try:
        mouse_clicker.run()
    finally:
        # Stop the server when the GUI is closed
        server.stop() 