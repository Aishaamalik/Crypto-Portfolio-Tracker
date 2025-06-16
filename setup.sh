#!/bin/bash

# Create virtual environment for backend
echo "Setting up Python virtual environment..."
python -m venv backend/venv
source backend/venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

# Initialize frontend
echo "Setting up frontend..."
cd frontend
npm install

# Create necessary directories if they don't exist
mkdir -p backend/models
mkdir -p backend/routers
mkdir -p backend/services
mkdir -p backend/websocket
mkdir -p backend/utils

echo "Setup complete! To start the development servers:"
echo "1. Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "2. Frontend: cd frontend && npm run dev" 