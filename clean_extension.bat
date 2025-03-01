@echo off
echo Cleaning up __pycache__ directories...
if exist __pycache__ (
    rmdir /s /q __pycache__
    echo __pycache__ directory removed.
) else (
    echo No __pycache__ directory found.
)

echo.
echo Extension is now ready to be loaded in Chrome.
echo.
pause 