import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { ArrowUp, ArrowDown, DollarSign, TrendingUp, Wallet, Activity } from 'lucide-react'
import { binanceService } from '../services/binanceService'
import toast from 'react-hot-toast'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function Dashboard() {
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [portfolioChange, setPortfolioChange] = useState(0)
  const [chartData, setChartData] = useState({ labels: [], datasets: [] })
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = binanceService.initWebSocket((data) => {
      setPrices(data.prices)
      // Update portfolio value based on holdings
      const totalValue = Object.entries(data.prices).reduce((acc, [symbol, price]) => {
        // Here you would multiply by actual holdings
        return acc + (price * 1) // Placeholder: assuming 1 unit of each coin
      }, 0)
      setPortfolioValue(totalValue)
    })

    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        // Get BTC price and change for portfolio overview
        const btcData = await binanceService.getCoinPrice('BTC')
        setPortfolioChange(parseFloat(btcData.change_24h))

        // Get BTC forecast for chart
        const forecast = await binanceService.getCoinForecast('BTC')
        setChartData({
          labels: forecast.forecast.map(f => f.date),
          datasets: [
            {
              label: 'Portfolio Value Forecast',
              data: forecast.forecast.map(f => f.price),
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast.error('Failed to fetch market data')
        setLoading(false)
      }
    }

    fetchInitialData()

    // Cleanup WebSocket connection
    return () => {
      ws.close()
    }
  }, [])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Portfolio Value Forecast',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: { 
        beginAtZero: false,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  }

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
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your portfolio performance and market trends
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Value</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${portfolioValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                <DollarSign className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">24h Change</p>
                <div className="flex items-center">
                  <p className={`text-2xl font-semibold ${
                    portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {portfolioChange}%
                  </p>
                  {portfolioChange >= 0 ? (
                    <ArrowUp className="h-5 w-5 text-green-500 ml-1" />
                  ) : (
                    <ArrowDown className="h-5 w-5 text-red-500 ml-1" />
                  )}
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Assets</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {Object.keys(prices).length}
                </p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                <Wallet className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Market Activity</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Active
                </p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                <Activity className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <Line options={chartOptions} data={chartData} />
        </div>

        {/* Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <button className="text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300">
              View All
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
