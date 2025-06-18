import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { binanceService } from '../services/binanceService'
import { usePortfolio } from '../context/PortfolioContext'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function AddCoin() {
  const navigate = useNavigate()
  const { addHolding } = usePortfolio()
  const [formData, setFormData] = useState({
    symbol: '',
    amount: ''
  })
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSymbolChange = async (symbol) => {
    const upperSymbol = symbol.toUpperCase()
    setFormData({ ...formData, symbol: upperSymbol })
    
    // Clear previous price when symbol changes
    setCurrentPrice(null)
    
    // Fetch price if symbol is valid (at least 2 characters)
    if (upperSymbol.length >= 2) {
      setPriceLoading(true)
      try {
        const priceData = await binanceService.getCoinPrice(upperSymbol)
        setCurrentPrice(priceData.price)
      } catch (error) {
        console.error('Error fetching price:', error)
        setCurrentPrice(null)
      } finally {
        setPriceLoading(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.symbol || !formData.amount) {
      toast.error('Please enter both coin symbol and amount')
      return
    }
    
    setLoading(true)

    try {
      console.log('Submitting coin data:', formData)
      
      // Fetch current price for the coin during submission
      let priceData
      try {
        console.log('Fetching price for symbol:', formData.symbol)
        priceData = await binanceService.getCoinPrice(formData.symbol)
        console.log('Price data received:', priceData)
        setCurrentPrice(priceData.price)
      } catch (priceError) {
        console.error('Error fetching price:', priceError)
        console.error('Price error response:', priceError.response?.data)
        toast.error('Could not fetch current price. Please try again.')
        setLoading(false)
        return
      }

      // Create coin data with fetched price
      const coinData = {
        symbol: formData.symbol.toUpperCase(),
        amount: parseFloat(formData.amount),
        purchase_price: priceData.price,
        purchase_date: new Date().toISOString().split('T')[0]
      }
      
      console.log('Sending coin data to API:', coinData)

      // Add to portfolio using the context
      await addHolding(coinData)
      
      toast.success('Coin added successfully')
      navigate('/portfolio')
    } catch (error) {
      console.error('Error adding coin:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      toast.error('Failed to add coin. Please check the symbol and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            Add New Coin
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add a new cryptocurrency to your portfolio
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="symbol"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Coin Symbol
              </label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., BTC, ETH, SOL"
              />
              {priceLoading && (
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Fetching current price...
                </div>
              )}
              {currentPrice && !priceLoading && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  Current Price: ${currentPrice.toLocaleString()}
                </div>
              )}
              {!currentPrice && !priceLoading && formData.symbol.length >= 2 && (
                <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Price will be fetched when you submit
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Amount
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                step="0.000001"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 0.5"
              />
              {currentPrice && formData.amount && (
                <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  Estimated Value: ${(parseFloat(formData.amount) * currentPrice).toLocaleString()}
                </div>
              )}
              {!currentPrice && formData.amount && formData.symbol.length >= 2 && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Value will be calculated when price is fetched
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/portfolio')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.symbol || !formData.amount}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </div>
                ) : (
                  'Add Coin'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 