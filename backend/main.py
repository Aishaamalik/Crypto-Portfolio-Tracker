from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json
import asyncio
from datetime import datetime
import uvicorn
from services.binance_service import BinanceService
from pydantic import BaseModel
from sqlalchemy.orm import Session
from utils.database import get_db, engine
from models.models import Base, User, Portfolio, Holding
from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

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
    purchase_date: str

class PortfolioSave(BaseModel):
    user_id: int = 1  # Default user ID for now
    portfolio_name: str = "My Portfolio"
    holdings: List[Dict[str, Any]]

class HoldingData(BaseModel):
    symbol: str
    amount: float
    purchase_price: float
    purchase_date: str

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

@app.get("/test-db")
async def test_database(db: Session = Depends(get_db)):
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        return {"status": "Database connection successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Portfolio endpoints
@app.post("/portfolio/manual")
async def add_coin_manually(coin: CoinManual):
    try:
        print(f"Received coin data: {coin.dict()}")  # Debug log
        
        # Get current price from Binance
        current_price = await BinanceService.get_current_price(coin.symbol)
        print(f"Current price for {coin.symbol}: {current_price}")  # Debug log
        
        return {
            "message": "Coin added successfully",
            "coin": coin.dict(),
            "current_price": current_price
        }
    except Exception as e:
        print(f"Error in add_coin_manually: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to add coin: {str(e)}")

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
        print(f"Fetching price for coin: {coin_id}")  # Debug log
        
        price_data = await BinanceService.get_current_price(coin_id)
        change_24h = await BinanceService.get_24h_change(coin_id)
        
        print(f"Price data: {price_data}")  # Debug log
        print(f"24h change: {change_24h}")  # Debug log
        
        return {
            "symbol": coin_id,
            "price": price_data["price"],
            "change_24h": change_24h["priceChangePercent"],
            "price_change": change_24h["priceChange"],
            "last_price": change_24h["lastPrice"]
        }
    except Exception as e:
        print(f"Error in get_coin_price for {coin_id}: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to fetch price for {coin_id}: {str(e)}")

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

# Database endpoints for portfolio management
@app.post("/portfolio/save")
async def save_portfolio(portfolio_data: PortfolioSave, db: Session = Depends(get_db)):
    try:
        print(f"Received portfolio data: {portfolio_data.dict()}")  # Debug log
        
        # Check if user exists, create if not
        user = db.query(User).filter(User.id == portfolio_data.user_id).first()
        if not user:
            user = User(id=portfolio_data.user_id, email=f"user{portfolio_data.user_id}@example.com", username=f"user{portfolio_data.user_id}")
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Check if portfolio exists, create if not
        portfolio = db.query(Portfolio).filter(
            Portfolio.user_id == portfolio_data.user_id,
            Portfolio.name == portfolio_data.portfolio_name
        ).first()
        
        if not portfolio:
            portfolio = Portfolio(
                user_id=portfolio_data.user_id,
                name=portfolio_data.portfolio_name
            )
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)
        
        # Clear existing holdings for this portfolio
        db.query(Holding).filter(Holding.portfolio_id == portfolio.id).delete()
        
        # Add new holdings
        for holding_data in portfolio_data.holdings:
            try:
                print(f"Processing holding: {holding_data}")  # Debug log
                
                # Handle purchase_date more safely
                purchase_date = datetime.now()
                if "purchase_date" in holding_data and holding_data["purchase_date"]:
                    try:
                        if isinstance(holding_data["purchase_date"], str):
                            purchase_date = datetime.strptime(holding_data["purchase_date"], "%Y-%m-%d")
                        else:
                            purchase_date = datetime.now()
                    except ValueError:
                        purchase_date = datetime.now()
                
                holding = Holding(
                    portfolio_id=portfolio.id,
                    coin_id=holding_data["symbol"],
                    amount=float(holding_data["amount"]),
                    purchase_price=float(holding_data.get("purchase_price", 0)),
                    purchase_date=purchase_date
                )
                db.add(holding)
                print(f"Added holding: {holding.coin_id} - {holding.amount}")  # Debug log
            except Exception as e:
                print(f"Error processing holding {holding_data}: {str(e)}")  # Debug log
                raise e
        
        db.commit()
        print(f"Portfolio saved successfully with {len(portfolio_data.holdings)} holdings")  # Debug log
        
        return {
            "message": "Portfolio saved successfully",
            "portfolio_id": portfolio.id,
            "holdings_count": len(portfolio_data.holdings)
        }
    except Exception as e:
        db.rollback()
        print(f"Error saving portfolio: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to save portfolio: {str(e)}")

@app.get("/portfolio/{user_id}")
async def get_portfolio(user_id: int, db: Session = Depends(get_db)):
    try:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if not portfolio:
            return {"message": "No portfolio found", "holdings": []}
        
        holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio.id).all()
        
        holdings_data = []
        for holding in holdings:
            # Get current price from Binance
            try:
                current_price = await BinanceService.get_current_price(holding.coin_id)
                change_24h = await BinanceService.get_24h_change(holding.coin_id)
                
                holdings_data.append({
                    "id": holding.id,
                    "symbol": holding.coin_id,
                    "amount": holding.amount,
                    "purchase_price": holding.purchase_price,
                    "purchase_date": holding.purchase_date.isoformat() if holding.purchase_date else None,
                    "current_price": current_price["price"] if current_price else 0,
                    "change24h": change_24h["priceChangePercent"] if change_24h else 0,
                    "value": holding.amount * (current_price["price"] if current_price else 0)
                })
            except Exception as e:
                print(f"Error fetching price for {holding.coin_id}: {str(e)}")
                holdings_data.append({
                    "id": holding.id,
                    "symbol": holding.coin_id,
                    "amount": holding.amount,
                    "purchase_price": holding.purchase_price,
                    "purchase_date": holding.purchase_date.isoformat() if holding.purchase_date else None,
                    "current_price": 0,
                    "change24h": 0,
                    "value": 0
                })
        
        return {
            "portfolio_id": portfolio.id,
            "portfolio_name": portfolio.name,
            "holdings": holdings_data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get portfolio: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 