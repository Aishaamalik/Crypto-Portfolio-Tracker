import { useState } from 'react'
import { ArrowUp, ArrowDown, Trash2, Edit2, Plus, Search, Filter, Save, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import AddCoinModal from '../components/AddCoinModal'
import { usePortfolio } from '../context/PortfolioContext'

// Add portfolio holdings data - same as dashboard
const PORTFOLIO_HOLDINGS = {
  'BTC': 0.5,    // 0.5 BTC
  'ETH': 3.2,    // 3.2 ETH
  'BNB': 15,     // 15 BNB
  'SOL': 25,     // 25 SOL
  'ADA': 1000,   // 1000 ADA
  'DOT': 50,     // 50 DOT
  'AVAX': 20,    // 20 AVAX
  'MATIC': 500,  // 500 MATIC
  'LINK': 100,   // 100 LINK
  'UNI': 75      // 75 UNI
}

export default function Portfolio() {
  const { holdings, loading, deleteHolding, addHolding, savePortfolio, loadSavedPortfolio } = usePortfolio()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async (id) => {
    await deleteHolding(id)
  }

  const handleEdit = (id) => {
    // Implement edit functionality
    toast.success('Edit functionality coming soon')
  }

  const handleAddCoin = async (coinData) => {
    await addHolding(coinData)
    setIsAddModalOpen(false)
  }

  const handleSavePortfolio = async () => {
    setIsSaving(true)
    try {
      await savePortfolio()
    } catch (error) {
      console.error('Error saving portfolio:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadPortfolio = async () => {
    setIsLoading(true)
    try {
      await loadSavedPortfolio()
    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredHoldings = holdings.filter(holding =>
    holding.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
            Portfolio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your cryptocurrency holdings and track their performance
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search coins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </button>
            <button
              onClick={handleLoadPortfolio}
              disabled={isLoading}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5 mr-2" />
              {isLoading ? 'Loading...' : 'Load Portfolio'}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Coin
            </button>
            <button
              onClick={handleSavePortfolio}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save Portfolio'}
            </button>
          </div>
        </div>

        {/* Portfolio Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Coin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Allocation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredHoldings.map((holding) => (
                  <tr key={holding.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                            {holding.symbol.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {holding.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{holding.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        ${holding.value.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm ${
                          holding.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {holding.change24h}%
                        </span>
                        {holding.change24h >= 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500 ml-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-500 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {holding.allocation.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(holding.id)}
                        className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(holding.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AddCoinModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddCoin}
        />
      </div>
    </div>
  )
} 