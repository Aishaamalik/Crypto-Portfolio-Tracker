import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class BinanceService:
    BASE_URL = "https://api.binance.com/api/v3"
    
    @staticmethod
    async def get_current_price(symbol: str) -> Dict:
        """Get current price for a symbol"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BinanceService.BASE_URL}/ticker/price", params={"symbol": f"{symbol}USDT"}) as response:
                return await response.json()

    @staticmethod
    async def get_24h_change(symbol: str) -> Dict:
        """Get 24-hour price change statistics"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BinanceService.BASE_URL}/ticker/24hr", params={"symbol": f"{symbol}USDT"}) as response:
                return await response.json()

    @staticmethod
    async def get_historical_prices(symbol: str, interval: str = "1d", limit: int = 30) -> List:
        """Get historical klines/candlestick data"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{BinanceService.BASE_URL}/klines",
                params={
                    "symbol": f"{symbol}USDT",
                    "interval": interval,
                    "limit": limit
                }
            ) as response:
                return await response.json()

    @staticmethod
    async def get_all_prices() -> List:
        """Get all current prices"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BinanceService.BASE_URL}/ticker/price") as response:
                return await response.json()

    @staticmethod
    async def get_order_book(symbol: str, limit: int = 100) -> Dict:
        """Get order book for a symbol"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{BinanceService.BASE_URL}/depth",
                params={
                    "symbol": f"{symbol}USDT",
                    "limit": limit
                }
            ) as response:
                return await response.json()

    @staticmethod
    async def get_7day_forecast(symbol: str) -> Dict:
        """Get 7-day price forecast based on historical data"""
        # Get historical data for the last 30 days
        historical_data = await BinanceService.get_historical_prices(symbol, "1d", 30)
        
        # Calculate average daily change
        daily_changes = []
        for i in range(1, len(historical_data)):
            prev_close = float(historical_data[i-1][4])  # Previous day's close price
            curr_close = float(historical_data[i][4])    # Current day's close price
            daily_change = ((curr_close - prev_close) / prev_close) * 100
            daily_changes.append(daily_change)
        
        avg_daily_change = sum(daily_changes) / len(daily_changes)
        last_price = float(historical_data[-1][4])
        
        # Generate 7-day forecast
        forecast = []
        current_price = last_price
        for i in range(7):
            current_price = current_price * (1 + (avg_daily_change / 100))
            forecast.append({
                "date": (datetime.now() + timedelta(days=i+1)).strftime("%Y-%m-%d"),
                "price": round(current_price, 2)
            })
        
        return {
            "symbol": symbol,
            "current_price": last_price,
            "forecast": forecast
        } 