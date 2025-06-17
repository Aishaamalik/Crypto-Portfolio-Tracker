import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class BinanceService:
    BASE_URL = "https://api.binance.com/api/v3"
    
    @staticmethod
    async def get_current_price(symbol: str) -> Dict:
        """Get current price for a symbol"""
        try:
            # Ensure symbol is in correct format for Binance (e.g., BTCUSDT)
            formatted_symbol = f"{symbol}USDT"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{BinanceService.BASE_URL}/ticker/price", params={"symbol": formatted_symbol}) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        print(f"Error response from Binance for {formatted_symbol}: {error_text}")
                        return {
                            "symbol": symbol,
                            "price": 0
                        }
                    
                    data = await response.json()
                    return {
                        "symbol": symbol,
                        "price": float(data.get("price", 0))
                    }
        except Exception as e:
            print(f"Error getting price for {symbol}: {str(e)}")
            return {
                "symbol": symbol,
                "price": 0
            }

    @staticmethod
    async def get_24h_change(symbol: str) -> Dict:
        """Get 24-hour price change statistics"""
        try:
            # Ensure symbol is in correct format for Binance (e.g., BTCUSDT)
            formatted_symbol = f"{symbol}USDT"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{BinanceService.BASE_URL}/ticker/24hr", params={"symbol": formatted_symbol}) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        print(f"Error response from Binance for {formatted_symbol}: {error_text}")
                        return {
                            "symbol": symbol,
                            "priceChangePercent": 0,
                            "priceChange": 0,
                            "lastPrice": 0
                        }
                    
                    data = await response.json()
                    return {
                        "symbol": symbol,
                        "priceChangePercent": float(data.get("priceChangePercent", 0)),
                        "priceChange": float(data.get("priceChange", 0)),
                        "lastPrice": float(data.get("lastPrice", 0))
                    }
        except Exception as e:
            print(f"Error getting 24h change for {symbol}: {str(e)}")
            return {
                "symbol": symbol,
                "priceChangePercent": 0,
                "priceChange": 0,
                "lastPrice": 0
            }

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
        """Get 7-day price forecast based on historical data with enhanced analysis"""
        # Get historical data for the last 30 days
        historical_data = await BinanceService.get_historical_prices(symbol, "1d", 30)
        
        # Extract closing prices
        closing_prices = [float(day[4]) for day in historical_data]
        
        # Calculate daily changes and volatility
        daily_changes = []
        for i in range(1, len(closing_prices)):
            prev_close = closing_prices[i-1]
            curr_close = closing_prices[i]
            daily_change = ((curr_close - prev_close) / prev_close) * 100
            daily_changes.append(daily_change)
        
        # Calculate key metrics
        avg_daily_change = sum(daily_changes) / len(daily_changes)
        volatility = (sum((x - avg_daily_change) ** 2 for x in daily_changes) / len(daily_changes)) ** 0.5
        last_price = closing_prices[-1]
        
        # Trend analysis using simple moving averages
        sma_7 = sum(closing_prices[-7:]) / 7
        sma_14 = sum(closing_prices[-14:]) / 14
        trend_strength = ((sma_7 / sma_14) - 1) * 100
        
        # Calculate momentum indicators
        rsi = BinanceService.calculate_rsi(closing_prices)
        
        # Generate 7-day forecast with confidence intervals
        forecast = []
        current_price = last_price
        for i in range(7):
            # Adjust prediction based on trend strength
            trend_factor = 1 + (trend_strength / 100)
            predicted_change = avg_daily_change * trend_factor
            
            # Calculate confidence intervals
            confidence_interval = volatility * (i + 1) ** 0.5  # Wider intervals for further predictions
            
            current_price = current_price * (1 + (predicted_change / 100))
            forecast.append({
                "date": (datetime.now() + timedelta(days=i+1)).strftime("%Y-%m-%d"),
                "price": round(current_price, 2),
                "upper_bound": round(current_price * (1 + confidence_interval/100), 2),
                "lower_bound": round(current_price * (1 - confidence_interval/100), 2)
            })
        
        # Calculate additional market metrics
        price_range = max(closing_prices) - min(closing_prices)
        price_range_percent = (price_range / min(closing_prices)) * 100
        
        return {
            "symbol": symbol,
            "current_price": last_price,
            "forecast": forecast,
            "analysis": {
                "volatility": round(volatility, 2),
                "trend_strength": round(trend_strength, 2),
                "rsi": round(rsi, 2),
                "price_range_30d": round(price_range_percent, 2),
                "avg_daily_change": round(avg_daily_change, 2),
                "confidence_level": "High" if volatility < 2 else "Medium" if volatility < 5 else "Low"
            }
        }

    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index (RSI)"""
        if len(prices) < period + 1:
            return 50.0  # Default value if not enough data
            
        # Calculate price changes
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        
        # Separate gains and losses
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        # Calculate average gains and losses
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100.0
            
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi 