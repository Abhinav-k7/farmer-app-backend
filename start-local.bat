@echo off
REM 🌾 Farmer Connect - Local Testing Script (Windows)
REM This script helps you test the backend locally before deployment

echo.
echo 🚀 Starting Farmer Connect Backend Testing...
echo.

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found!
    echo Create .env file with MongoDB connection and API keys
    echo Copy from .env.example: copy .env.example .env
    pause
    exit /b 1
)

echo ✅ .env file found
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    call npm install
)

echo.
echo ✅ Dependencies installed
echo.

REM Start the server
echo 🔧 Starting backend server...
echo Server will run on: http://localhost:5000
echo.
echo 📝 To test, open another terminal/command prompt and run:
echo    curl http://localhost:5000/api/health
echo    or open browser: http://localhost:5000/health
echo.
echo Press Ctrl+C to stop
echo.

call npm run dev

pause
