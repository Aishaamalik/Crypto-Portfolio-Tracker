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

// Color constants
const COLORS = {
  primary: '#6366f1', // Indigo
  success: '#22c55e', // Green
  danger: '#ef4444',  // Red
  warning: '#f59e0b', // Amber
  background: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  border: '#e2e8f0',
  chart: {
    main: '#6366f1',
    upper: 'rgba(99, 102, 241, 0.3)',
    lower: 'rgba(99, 102, 241, 0.3)',
    grid: 'rgba(226, 232, 240, 0.5)',
  }
}

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
        return acc + (price * 1) // Placeholder: assuming 1 unit of each coin
      }, 0)
      setPortfolioValue(totalValue)
    })

    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        const btcData = await binanceService.getCoinPrice('BTC')
        setPortfolioChange(parseFloat(btcData.change_24h))

        const forecast = await binanceService.getCoinForecast('BTC')
        setChartData({
          labels: forecast.forecast.map(f => f.date),
          datasets: [
            {
              label: 'Price Forecast',
              data: forecast.forecast.map(f => f.price),
              borderColor: COLORS.chart.main,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.4,
              fill: true,
              borderWidth: 2,
            },
            {
              label: 'Upper Bound',
              data: forecast.forecast.map(f => f.upper_bound),
              borderColor: COLORS.chart.upper,
              borderDash: [5, 5],
              fill: false,
              borderWidth: 1,
            },
            {
              label: 'Lower Bound',
              data: forecast.forecast.map(f => f.lower_bound),
              borderColor: COLORS.chart.lower,
              borderDash: [5, 5],
              fill: false,
              borderWidth: 1,
            }
          ],
        })

        const analysisMetrics = forecast.analysis
        toast.success(
          `Market Analysis:
          Volatility: ${analysisMetrics.volatility}%
          Trend Strength: ${analysisMetrics.trend_strength}%
          RSI: ${analysisMetrics.rsi}
          Confidence: ${analysisMetrics.confidence_level}`,
          {
            style: {
              background: COLORS.card,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
            },
          }
        )
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast.error('Failed to fetch market data', {
          style: {
            background: COLORS.card,
            color: COLORS.danger,
            border: `1px solid ${COLORS.border}`,
          },
        })
        setLoading(false)
      }
    }

    fetchInitialData()

    return () => {
      ws.close()
    }
  }, [])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          color: COLORS.text,
          font: {
            size: 12,
          },
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: '7-Day Price Forecast with Confidence Intervals',
        font: {
          size: 16,
          weight: 'bold',
          color: COLORS.text,
        }
      },
      tooltip: {
        backgroundColor: COLORS.card,
        titleColor: COLORS.text,
        bodyColor: COLORS.text,
        borderColor: COLORS.border,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: false,
        grid: {
          color: COLORS.chart.grid,
        },
        ticks: {
          color: COLORS.text,
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: COLORS.text,
        }
      }
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: COLORS.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.background }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Portfolio Value Card */}
          <div className="p-6 rounded-lg shadow-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS.text }}>Portfolio Value</p>
                <p className="text-2xl font-bold mt-1" style={{ color: COLORS.text }}>
                  ${portfolioValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ background: `${COLORS.primary}20` }}>
                <Wallet className="w-6 h-6" style={{ color: COLORS.primary }} />
              </div>
            </div>
          </div>

          {/* 24h Change Card */}
          <div className="p-6 rounded-lg shadow-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS.text }}>24h Change</p>
                <div className="flex items-center mt-1">
                  {portfolioChange >= 0 ? (
                    <ArrowUp className="w-4 h-4 mr-1" style={{ color: COLORS.success }} />
                  ) : (
                    <ArrowDown className="w-4 h-4 mr-1" style={{ color: COLORS.danger }} />
                  )}
                  <p className="text-2xl font-bold" style={{ color: portfolioChange >= 0 ? COLORS.success : COLORS.danger }}>
                    {Math.abs(portfolioChange).toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-full" style={{ background: `${portfolioChange >= 0 ? COLORS.success : COLORS.danger}20` }}>
                <TrendingUp className="w-6 h-6" style={{ color: portfolioChange >= 0 ? COLORS.success : COLORS.danger }} />
              </div>
            </div>
          </div>

          {/* Market Activity Card */}
          <div className="p-6 rounded-lg shadow-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS.text }}>Market Activity</p>
                <p className="text-2xl font-bold mt-1" style={{ color: COLORS.text }}>
                  Active
                </p>
              </div>
              <div className="p-3 rounded-full" style={{ background: `${COLORS.warning}20` }}>
                <Activity className="w-6 h-6" style={{ color: COLORS.warning }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="p-6 rounded-lg shadow-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}
