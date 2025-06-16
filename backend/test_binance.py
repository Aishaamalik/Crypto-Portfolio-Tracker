import asyncio
from services.binance_service import BinanceService

async def test_connection():
    try:
        # Test getting BTC price
        btc_price = await BinanceService.get_current_price('BTC')
        print("BTC Price:", btc_price)
        
        # Test getting 24h change
        btc_change = await BinanceService.get_24h_change('BTC')
        print("BTC 24h Change:", btc_change)
        
        print("\nBinance API is working correctly!")
    except Exception as e:
        print("Error connecting to Binance API:", str(e))

if __name__ == "__main__":
    asyncio.run(test_connection()) 