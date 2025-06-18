import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { binanceService } from '../services/binanceService'
import toast from 'react-hot-toast'

export default function AddCoinModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    symbol: '',
    amount: ''
  })
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.symbol || !formData.amount) {
      toast.error('Please enter both coin symbol and amount')
      return
    }
    
    setLoading(true)

    try {
      console.log('Submitting coin data:', formData) // Debug log
      
      // Fetch current price for the coin during submission
      let priceData
      try {
        console.log('Fetching price for symbol:', formData.symbol) // Debug log
        priceData = await binanceService.getCoinPrice(formData.symbol)
        console.log('Price data received:', priceData) // Debug log
        setCurrentPrice(priceData.price)
      } catch (priceError) {
        console.error('Error fetching price:', priceError) // Debug log
        console.error('Price error response:', priceError.response?.data) // Debug log
        toast.error('Could not fetch current price. Please try again.')
        setLoading(false)
        return
      }

      // Create coin data with fetched price
      const coinData = {
        symbol: formData.symbol.toUpperCase(),
        amount: parseFloat(formData.amount),
        purchase_price: priceData.price,
        purchase_date: new Date().toISOString().split('T')[0] // Current date
      }
      
      console.log('Sending coin data to API:', coinData) // Debug log

      await binanceService.addCoinManually(coinData)
      toast.success('Coin added successfully')
      onSuccess(coinData)
      onClose()
      
      // Reset form
      setFormData({ symbol: '', amount: '' })
      setCurrentPrice(null)
    } catch (error) {
      console.error('Error adding coin:', error) // Debug log
      console.error('Error response:', error.response?.data) // Debug log
      console.error('Error status:', error.response?.status) // Debug log
      toast.error('Failed to add coin. Please check the symbol and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSymbolChange = async (symbol) => {
    const upperSymbol = symbol.toUpperCase()
    setFormData({ ...formData, symbol: upperSymbol })
    
    // Clear previous price when symbol changes
    setCurrentPrice(null)
    
    // Fetch price if symbol is valid (at least 2 characters) - this is just for display
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Coin
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Coin Symbol
                </label>
                <input
                  type="text"
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  placeholder="e.g., BTC"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
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
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g., 0.5"
                  step="any"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
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
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.symbol || !formData.amount}
                className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Coin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 