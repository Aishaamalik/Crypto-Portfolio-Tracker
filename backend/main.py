from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
import asyncio
from datetime import datetime
import uvicorn
from services.binance_service import BinanceService
from pydantic import BaseModel

app = FastAPI(title="Crypto Portfolio Tracker API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class CoinManual(BaseModel):
    symbol: str
    amount: float
    purchase_price: float
    purchase_date: datetime

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# WebSocket endpoint for real-time price updates
@app.websocket("/ws/prices")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Get real-time prices and 24h changes from Binance
            prices = await BinanceService.get_all_prices()
            price_data = {}
            
            # List of valid trading pairs we want to track
            valid_pairs = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI']
            
            for symbol in valid_pairs:
                try:
                    price = await BinanceService.get_current_price(symbol)
                    change_24h = await BinanceService.get_24h_change(symbol)
                    
                    if price and change_24h:
                        price_data[symbol] = {
                            "price": price["price"],
                            "change_24h": change_24h["priceChangePercent"],
                            "price_change": change_24h["priceChange"],
                            "last_price": change_24h["lastPrice"]
                        }
                except Exception as e:
                    print(f"Error getting data for {symbol}: {str(e)}")
                    continue
            
            data = {
                "timestamp": datetime.now().isoformat(),
                "prices": price_data
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(1)  # Update every second
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in WebSocket: {str(e)}")
        manager.disconnect(websocket)

# Basic health check endpoint
@app.get("/")
async def root():
    return {"status": "healthy", "message": "Crypto Portfolio Tracker API is running"}

# Portfolio endpoints
@app.post("/portfolio/manual")
async def add_coin_manually(coin: CoinManual):
    try:
        # Get current price from Binance
        current_price = await BinanceService.get_current_price(coin.symbol)
        return {
            "message": "Coin added successfully",
            "coin": coin.dict(),
            "current_price": current_price
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/portfolio/address/{wallet}")
async def sync_wallet(wallet: str):
    try:
        # Here you would implement wallet synchronization logic
        # For now, return a mock response
        return {
            "message": f"Wallet {wallet} synchronized",
            "holdings": []
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/price/{coin_id}")
async def get_coin_price(coin_id: str):
    try:
        price_data = await BinanceService.get_current_price(coin_id)
        change_24h = await BinanceService.get_24h_change(coin_id)
        return {
            "symbol": coin_id,
            "price": price_data["price"],
            "change_24h": change_24h["priceChangePercent"],
            "price_change": change_24h["priceChange"],
            "last_price": change_24h["lastPrice"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/forecast/{coin_id}")
async def get_coin_forecast(coin_id: str):
    try:
        forecast = await BinanceService.get_7day_forecast(coin_id)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/compare/{user_id}")
async def compare_portfolio(user_id: str):
    try:
        # Get all current prices
        all_prices = await BinanceService.get_all_prices()
        # Here you would implement portfolio comparison logic
        return {
            "message": f"Portfolio comparison for user {user_id}",
            "market_data": all_prices
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 