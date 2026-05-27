@echo off
title CineNeural — Local Server
echo.
echo  Starting CineNeural...
echo.

:: Try Python 3 first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo  Server running at: http://localhost:8080
    echo  Opening in browser...
    echo  Press Ctrl+C to stop.
    echo.
    start "" "http://localhost:8080"
    python -m http.server 8080
    goto :end
)

:: Try py launcher
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo  Server running at: http://localhost:8080
    echo  Opening in browser...
    echo  Press Ctrl+C to stop.
    echo.
    start "" "http://localhost:8080"
    py -m http.server 8080
    goto :end
)

:: Python not found — open file directly (OMDB may have CORS issues)
echo  Python not found. Opening file directly...
echo  Note: movie data may not load due to browser security.
echo  Install Python from https://python.org to fix this.
echo.
pause
start "" "%~dp0index.html"

:end
