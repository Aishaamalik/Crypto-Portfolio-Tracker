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
        console.log('Loading initial holdings...'); // Debug log
        
        // First try to load from localStorage
        const localStorageData = loadFromLocalStorage();
        if (localStorageData && localStorageData.holdings && localStorageData.holdings.length > 0) {
          console.log('Found localStorage data, loading from localStorage...'); // Debug log
          const localHoldings = localStorageData.holdings.map((holding, index) => ({
            id: index + 1,
            symbol: holding.symbol,
            amount: holding.amount,
            value: 0,
            change24h: 0,
            allocation: 0,
            purchase_price: holding.purchase_price,
            purchase_date: holding.purchase_date
          }))
          setHoldings(localHoldings)
          toast.success('Portfolio loaded from local storage')
          
          // Fetch current prices for local holdings
          const pricePromises = localHoldings.map(async (holding) => {
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

          // Update holdings with current prices
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
        } else {
          // Try to load saved portfolio from database as fallback
          const response = await fetch('http://localhost:8000/portfolio/1')
          console.log('Database response status:', response.status); // Debug log
          
          if (response.ok) {
            const data = await response.json()
            console.log('Database response data:', data); // Debug log
            
            if (data.holdings && data.holdings.length > 0) {
              console.log('Found saved holdings, loading from database...'); // Debug log
              const savedHoldings = data.holdings.map(holding => ({
                id: holding.id,
                symbol: holding.symbol,
                amount: holding.amount,
                value: holding.value || 0,
                change24h: holding.change24h || 0,
                allocation: 0,
                purchase_price: holding.purchase_price,
                purchase_date: holding.purchase_date
              }))
              setHoldings(savedHoldings)
              toast.success('Portfolio loaded from database')
              
              // Fetch current prices for saved holdings
              const pricePromises = savedHoldings.map(async (holding) => {
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

              // Update holdings with current prices
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
            } else {
              console.log('No database holdings, using default holdings...'); // Debug log
              // Use default holdings if no saved data
              const initialHoldings = Object.entries(PORTFOLIO_HOLDINGS).map(([symbol, amount], index) => ({
                id: index + 1,
                symbol,
                amount,
                value: 0,
                change24h: 0,
                allocation: 0
              }));
              
              setHoldings(initialHoldings);
              
              // Fetch initial prices for default holdings
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
            }
          } else {
            console.log('Database response not ok, using default holdings...'); // Debug log
            // If database is not available, use default holdings
            const initialHoldings = Object.entries(PORTFOLIO_HOLDINGS).map(([symbol, amount], index) => ({
              id: index + 1,
              symbol,
              amount,
              value: 0,
              change24h: 0,
              allocation: 0
            }));
            
            setHoldings(initialHoldings);
            
            // Fetch initial prices for default holdings
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
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading holdings:', error);
        toast.error('Failed to load portfolio, using default data');
        
        // Fallback to default holdings on error
        const initialHoldings = Object.entries(PORTFOLIO_HOLDINGS).map(([symbol, amount], index) => ({
          id: index + 1,
          symbol,
          amount,
          value: 0,
          change24h: 0,
          allocation: 0
        }));
        
        setHoldings(initialHoldings);
        setLoading(false);
      }
    };

    // Helper function to load from localStorage
    const loadFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem('cryptoPortfolio');
        if (saved) {
          const data = JSON.parse(saved);
          console.log('Loaded from localStorage:', data);
          return data;
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
      return null;
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
      setHoldings(prevHoldings => {
        const newHoldings = prevHoldings.filter(holding => holding.id !== id)
        // Save to localStorage after deletion
        saveToLocalStorage(newHoldings)
        return newHoldings
      })
      toast.success('Holding deleted successfully')
    } catch (error) {
      toast.error('Failed to delete holding')
    }
  }

  const addHolding = async (coinData) => {
    try {
      // Get current price data for the coin
      let currentPrice = coinData.purchasePrice // Use the fetched price
      let change24h = 0
      
      try {
        const priceData = await binanceService.getCoinPrice(coinData.symbol)
        currentPrice = priceData.price
        change24h = priceData.change_24h
      } catch (error) {
        console.error(`Error fetching current price for ${coinData.symbol}:`, error)
        // Use the purchase price as fallback
      }

      const newHolding = {
        id: Date.now(),
        symbol: coinData.symbol,
        amount: coinData.amount,
        value: coinData.amount * currentPrice,
        change24h: change24h,
        allocation: 0
      }
      
      setHoldings(prevHoldings => {
        const newHoldings = [...prevHoldings, newHolding]
        // Save to localStorage after addition
        saveToLocalStorage(newHoldings)
        return newHoldings
      })
      toast.success('Coin added successfully')
    } catch (error) {
      console.error('Error adding coin:', error)
      toast.error('Failed to add coin')
    }
  }

  // Helper function to save to localStorage
  const saveToLocalStorage = (holdingsData) => {
    try {
      const portfolioData = {
        user_id: 1,
        portfolio_name: "My Portfolio",
        holdings: holdingsData.map(holding => ({
          symbol: holding.symbol,
          amount: holding.amount,
          purchase_price: holding.purchase_price || 0,
          purchase_date: holding.purchase_date || new Date().toISOString().split('T')[0]
        })),
        lastSaved: new Date().toISOString()
      }
      
      localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolioData))
      console.log('Portfolio auto-saved to localStorage')
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  const savePortfolio = async () => {
    try {
      const portfolioData = {
        user_id: 1, // Default user ID
        portfolio_name: "My Portfolio",
        holdings: holdings.map(holding => ({
          symbol: holding.symbol,
          amount: holding.amount,
          purchase_price: holding.purchase_price || 0,
          purchase_date: holding.purchase_date || new Date().toISOString().split('T')[0]
        }))
      }

      console.log('Sending portfolio data:', portfolioData) // Debug log

      const response = await fetch('http://localhost:8000/portfolio/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend error:', errorData) // Debug log
        throw new Error(`Failed to save portfolio: ${errorData.detail || 'Unknown error'}`)
      }

      const result = await response.json()
      
      // Also save to localStorage as backup
      try {
        localStorage.setItem('cryptoPortfolio', JSON.stringify({
          ...portfolioData,
          lastSaved: new Date().toISOString()
        }))
        console.log('Portfolio saved to localStorage as backup')
      } catch (localStorageError) {
        console.error('Failed to save to localStorage:', localStorageError)
      }
      
      toast.success('Portfolio saved successfully!')
      return result
    } catch (error) {
      console.error('Error saving portfolio:', error)
      toast.error(error.message || 'Failed to save portfolio')
      throw error
    }
  }

  // Helper function to update holdings with current prices
  const updateHoldingsWithPrices = async (holdingsData, sourceName) => {
    try {
      // Fetch current prices for the holdings
      const pricePromises = holdingsData.map(async (holding) => {
        try {
          const priceData = await binanceService.getCoinPrice(holding.symbol);
          return {
            symbol: holding.symbol,
            price: priceData.price,
            change24h: priceData.change_24h
          };
        } catch (error) {
          console.error(`Error fetching current price for ${holding.symbol}:`, error);
          return null;
        }
      });

      const priceResults = await Promise.all(pricePromises);
      const validPrices = priceResults.filter(result => result !== null);

      // Update holdings with current prices
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
      
      toast.success(`Portfolio loaded from ${sourceName} with current prices`);
    } catch (error) {
      console.error(`Error updating holdings with prices from ${sourceName}:`, error);
      toast.error(`Failed to update prices from ${sourceName}`);
    }
  };

  const loadSavedPortfolio = async () => {
    try {
      console.log('Loading saved portfolio...'); // Debug log
      const response = await fetch('http://localhost:8000/portfolio/1')
      
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded portfolio data:', data); // Debug log
        
        if (data.holdings && data.holdings.length > 0) {
          const formattedHoldings = data.holdings.map(holding => ({
            id: holding.id,
            symbol: holding.symbol,
            amount: holding.amount,
            value: holding.value || 0,
            change24h: holding.change24h || 0,
            allocation: 0,
            purchase_price: holding.purchase_price,
            purchase_date: holding.purchase_date
          }))
          
          setHoldings(formattedHoldings)
          await updateHoldingsWithPrices(formattedHoldings, 'database');
        } else {
          toast.info('No saved portfolio found')
        }
      } else {
        console.error('Failed to load portfolio, response not ok:', response.status);
        toast.error('Failed to load portfolio from database')
      }
    } catch (error) {
      console.error('Error loading saved portfolio:', error)
      toast.error('Failed to load portfolio from database')
    }
  }

  const loadFromLocalStorage = async () => {
    try {
      const saved = localStorage.getItem('cryptoPortfolio');
      console.log('Raw localStorage data:', saved); // Debug log
      
      if (!saved) {
        toast.info('No saved portfolio found in local storage');
        return;
      }

      let data;
      try {
        data = JSON.parse(saved);
        console.log('Parsed localStorage data:', data);
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
        toast.error('Invalid data in local storage');
        return;
      }
      
      if (!data || !data.holdings || !Array.isArray(data.holdings) || data.holdings.length === 0) {
        toast.info('No valid portfolio data found in local storage');
        return;
      }

      const localHoldings = data.holdings.map((holding, index) => ({
        id: index + 1,
        symbol: holding.symbol,
        amount: holding.amount,
        value: 0,
        change24h: 0,
        allocation: 0,
        purchase_price: holding.purchase_price,
        purchase_date: holding.purchase_date
      }));
      
      console.log('Formatted local holdings:', localHoldings);
      setHoldings(localHoldings);
      
      // Update with current prices
      await updateHoldingsWithPrices(localHoldings, 'local storage');
      
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      toast.error('Failed to load portfolio from local storage');
    }
  }

  const value = {
    holdings,
    prices,
    loading,
    deleteHolding,
    addHolding,
    savePortfolio,
    loadSavedPortfolio,
    loadFromLocalStorage
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