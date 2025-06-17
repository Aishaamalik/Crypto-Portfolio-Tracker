# Crypto Portfolio Tracker

A full-stack web application for tracking cryptocurrency portfolios with real-time price updates, historical data analysis, and price predictions.

## Features

- 📊 Real-time portfolio tracking
- 💹 Live price updates via WebSocket
- 📈 Historical price charts
- 🔮 7-day price predictions using Prophet
- 🌓 Dark/Light theme support
- 📱 Responsive design for mobile and desktop
- 🔄 Manual coin addition and wallet synchronization
- 📊 Portfolio comparison with market performance

## Tech Stack

### Frontend
- React.js
- TailwindCSS
- Chart.js
- Axios
- React Router
- Lucide Icons
- Google Fonts (Poppins)

### Backend
- FastAPI
- WebSockets
- Pandas
- Prophet (Facebook)
- SQLite/PostgreSQL
- Binance API Integration

## Project Structure

```
📁 root/
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   ├── main.jsx
│   └── tailwind.config.js
├── backend/
│   ├── main.py
│   ├── models/
│   ├── routers/
│   ├── services/
│   ├── websocket/
│   └── utils/
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip
- npm or yarn

### Windows Setup
1. Run the setup script:
```powershell
.\setup.bat
```

2. Start the backend server:
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

3. Start the frontend development server:
```powershell
cd frontend
npm run dev
```

### Unix/Linux/Mac Setup
1. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

2. Start the backend server:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

3. Start the frontend development server:
```bash
cd frontend
npm run dev
```

## API Endpoints

- `POST /portfolio/manual` - Add a coin manually
- `GET /portfolio/address/{wallet}` - Sync with wallet
- `GET /price/{coin_id}` - Get real-time price
- `GET /forecast/{coin_id}` - Predict 7-day prices
- `GET /compare/{user_id}` - Compare portfolio vs market
- `WebSocket /ws/prices` - Live price updates

## License

MIT
