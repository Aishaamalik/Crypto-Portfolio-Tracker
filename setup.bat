@echo off

echo Setting up Python virtual environment...
if not exist backend\venv (
    python -m venv backend\venv
)

echo Activating virtual environment...
call backend\venv\Scripts\activate.bat

echo Installing backend dependencies...
pip install -r backend\requirements.txt

echo Setting up frontend...
cd frontend
call npm install
cd ..

echo Creating necessary directories...
if not exist backend\models mkdir backend\models
if not exist backend\routers mkdir backend\routers
if not exist backend\services mkdir backend\services
if not exist backend\websocket mkdir backend\websocket
if not exist backend\utils mkdir backend\utils

echo Setup complete! To start the development servers:
echo 1. Backend: cd backend ^&^& venv\Scripts\activate.bat ^&^& uvicorn main:app --reload
echo 2. Frontend: cd frontend ^&^& npm run dev

pause 