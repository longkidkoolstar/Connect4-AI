@echo off
echo Updating Python code...
REM Add your code update commands here

echo Building the executable...
pyinstaller --onefile connect4_extension_bridge.py

echo Replacing old executable...
move /Y dist\connect4_extension_bridge.exe path\to\your\existing\dist\folder

echo Build complete. You can now run the updated executable.
pause