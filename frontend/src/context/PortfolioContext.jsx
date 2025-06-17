import { createContext, useContext, useState, useEffect } from 'react'
import { binanceService } from '../services/binanceService'
import toast from 'react-hot-toast'

const PortfolioContext = createContext()

// Default portfolio holdings with realistic amounts
const PORTFOLIO_HOLDINGS = {
  'BTC': 0.5,     // Bitcoin
  'ETH': 3.2,     // Ethereum
  'BNB': 15,      // Binance Coin
  'SOL': 25,      // Solana
  'ADA': 1000,    // Cardano
  'DOT': 50,      // Polkadot
  'AVAX': 20,     // Avalanche
  'MATIC': 500,   // Polygon
  'LINK': 100,    // Chainlink
  'UNI': 75,      // Uniswap
  'XRP': 2000,    // Ripple
  'DOGE': 5000,   // Dogecoin
  'SHIB': 1000000,// Shiba Inu
  'LTC': 10,      // Litecoin
  'ATOM': 30,     // Cosmos
  'NEAR': 100,    // NEAR Protocol
  'ALGO': 500,    // Algorand
  'VET': 2000,    // VeChain
  'MANA': 1000,   // Decentraland
  'SAND': 500     // The Sandbox
}

export function PortfolioProvider({ children }) {
  const [holdings, setHoldings] = useState([])
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize WebSocket connection for real-time prices
    const ws = binanceService.initWebSocket((data) => {
      console.log('WebSocket data received:', data); // Debug log
      setPrices(data.prices);
      
      // Update holdings with current prices and 24h changes
      setHoldings(prevHoldings => 
        prevHoldings.map(holding => {
          const priceData = data.prices[holding.symbol];
          if (!priceData) {
            console.log(`No price data for ${holding.symbol}`); // Debug log
            return holding;
          }
          
          return {
            ...holding,
            value: holding.amount * priceData.price,
            change24h: priceData.change_24h
          };
        })
      );
    });

    // Load initial holdings
    const loadHoldings = async () => {
      try {
        // Convert PORTFOLIO_HOLDINGS to array format
        const initialHoldings = Object.entries(PORTFOLIO_HOLDINGS).map(([symbol, amount], index) => ({
          id: index + 1,
          symbol,
          amount,
          value: 0,
          change24h: 0,
          allocation: 0
        }));
        
        setHoldings(initialHoldings);
        
        // Fetch initial prices for all holdings
        const pricePromises = initialHoldings.map(async (holding) => {
          try {
            const priceData = await binanceService.getCoinPrice(holding.symbol);
            return {
              symbol: holding.symbol,
              price: priceData.price,
              change24h: priceData.change_24h
            };
          } catch (error) {
            console.error(`Error fetching initial price for ${holding.symbol}:`, error);
            return null;
          }
        });

        const priceResults = await Promise.all(pricePromises);
        const validPrices = priceResults.filter(result => result !== null);

        // Update holdings with initial prices
        setHoldings(prevHoldings =>
          prevHoldings.map(holding => {
            const priceData = validPrices.find(p => p.symbol === holding.symbol);
            if (!priceData) return holding;

            return {
              ...holding,
              value: holding.amount * priceData.price,
              change24h: priceData.change24h
            };
          })
        );

        setLoading(false);
      } catch (error) {
        console.error('Error loading holdings:', error);
        toast.error('Failed to load portfolio');
        setLoading(false);
      }
    };

    loadHoldings();

    return () => {
      ws.close();
    };
  }, []);

  // Calculate allocation percentages whenever holdings or prices change
  useEffect(() => {
    if (holdings.length > 0) {
      const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0)
      setHoldings(prevHoldings =>
        prevHoldings.map(holding => ({
          ...holding,
          allocation: totalValue > 0 ? (holding.value / totalValue) * 100 : 0
        }))
      )
    }
  }, [holdings])

  const deleteHolding = async (id) => {
    try {
      setHoldings(prevHoldings => prevHoldings.filter(holding => holding.id !== id))
      toast.success('Holding deleted successfully')
    } catch (error) {
      toast.error('Failed to delete holding')
    }
  }

  const addHolding = async (coinData) => {
    try {
      const newHolding = {
        id: Date.now(),
        symbol: coinData.symbol,
        amount: coinData.amount,
        value: coinData.amount * (prices[coinData.symbol] || 0),
        change24h: 0,
        allocation: 0
      }
      setHoldings(prevHoldings => [...prevHoldings, newHolding])
      toast.success('Coin added successfully')
    } catch (error) {
      console.error('Error adding coin:', error)
      toast.error('Failed to add coin')
    }
  }

  const value = {
    holdings,
    prices,
    loading,
    deleteHolding,
    addHolding
  }

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }
  return context
} 