import { useState, useEffect } from 'react'
import { Line, Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js'
import { ArrowUp, ArrowDown, DollarSign, TrendingUp, Wallet, Activity, PieChart, BarChart2 } from 'lucide-react'
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
  Legend,
  ArcElement,
  BarElement
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

// Add color mapping for consistent colors across charts
const COIN_COLORS = {
  'BTC': '#6366f1',  // Indigo
  'ETH': '#22c55e',  // Green
  'BNB': '#f59e0b',  // Amber
  'SOL': '#ef4444',  // Red
  'ADA': '#8b5cf6',  // Purple
  'DOT': '#ec4899',  // Pink
  'AVAX': '#14b8a6', // Teal
  'MATIC': '#f97316',// Orange
  'LINK': '#84cc16', // Lime
  'UNI': '#06b6d4'   // Cyan
}

// Add portfolio holdings data
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

export default function Dashboard() {
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [portfolioChange, setPortfolioChange] = useState(0)
  const [chartData, setChartData] = useState({ labels: [], datasets: [] })
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [portfolioDistribution, setPortfolioDistribution] = useState({ labels: [], datasets: [] })
  const [comparisonData, setComparisonData] = useState({ labels: [], datasets: [] })
  const [performanceMetrics, setPerformanceMetrics] = useState({
    bestPerformer: { symbol: '', change: 0 },
    worstPerformer: { symbol: '', change: 0 },
    totalGain: 0,
    totalLoss: 0
  })
  const [portfolioCoins, setPortfolioCoins] = useState([])

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = binanceService.initWebSocket((data) => {
      // Filter prices to only include coins in our portfolio
      const portfolioPrices = Object.entries(data.prices)
        .filter(([symbol]) => PORTFOLIO_HOLDINGS[symbol])
        .reduce((acc, [symbol, price]) => ({ ...acc, [symbol]: price }), {})
      
      setPrices(portfolioPrices)
      
      // Calculate total portfolio value based on actual holdings
      const totalValue = Object.entries(portfolioPrices).reduce((acc, [symbol, price]) => {
        const holdings = PORTFOLIO_HOLDINGS[symbol]
        return acc + (price * holdings)
      }, 0)
      setPortfolioValue(totalValue)

      // Update portfolio distribution with actual holdings
      const distribution = {
        labels: Object.keys(PORTFOLIO_HOLDINGS),
        datasets: [{
          data: Object.entries(PORTFOLIO_HOLDINGS).map(([symbol, holdings]) => {
            const price = portfolioPrices[symbol] || 0
            return price * holdings
          }),
          backgroundColor: Object.keys(PORTFOLIO_HOLDINGS).map(symbol => COIN_COLORS[symbol]),
        }]
      }
      setPortfolioDistribution(distribution)

      // Update comparison data with actual holdings vs market average
      const comparison = {
        labels: Object.keys(PORTFOLIO_HOLDINGS),
        datasets: [
          {
            label: 'Your Holdings',
            data: Object.entries(PORTFOLIO_HOLDINGS).map(([symbol, holdings]) => {
              const price = portfolioPrices[symbol] || 0
              return price * holdings
            }),
            backgroundColor: Object.keys(PORTFOLIO_HOLDINGS).map(symbol => COIN_COLORS[symbol]),
          },
          {
            label: 'Market Average',
            data: Object.entries(PORTFOLIO_HOLDINGS).map(([symbol, holdings]) => {
              const price = portfolioPrices[symbol] || 0
              return price * (holdings * 1.2)
            }),
            backgroundColor: Object.keys(PORTFOLIO_HOLDINGS).map(symbol => 
              `${COIN_COLORS[symbol]}80`
            ),
          }
        ]
      }
      setComparisonData(comparison)

      // Calculate performance metrics with actual holdings
      const changes = Object.entries(portfolioPrices).map(([symbol, price]) => {
        const holdings = PORTFOLIO_HOLDINGS[symbol]
        const previousPrice = price * 0.9
        const currentValue = price * holdings
        const previousValue = previousPrice * holdings
        const change = ((currentValue - previousValue) / previousValue) * 100
        return { symbol, change, value: currentValue }
      })
      
      const sortedChanges = changes.sort((a, b) => b.change - a.change)
      setPerformanceMetrics({
        bestPerformer: sortedChanges[0],
        worstPerformer: sortedChanges[sortedChanges.length - 1],
        totalGain: changes.filter(c => c.change > 0).reduce((acc, curr) => acc + curr.value, 0),
        totalLoss: Math.abs(changes.filter(c => c.change < 0).reduce((acc, curr) => acc + curr.value, 0))
      })

      // Update portfolio coins list
      setPortfolioCoins(Object.keys(PORTFOLIO_HOLDINGS))
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
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          color: COLORS.text,
          font: {
            size: 14,
            weight: '500',
          },
          usePointStyle: true,
          padding: 20,
        }
      },
      title: {
        display: true,
        text: '7-Day Price Forecast with Confidence Intervals',
        font: {
          size: 18,
          weight: 'bold',
          color: COLORS.text,
        },
        padding: {
          top: 20,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: COLORS.card,
        titleColor: COLORS.text,
        bodyColor: COLORS.text,
        borderColor: COLORS.border,
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
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
          drawBorder: false,
        },
        ticks: {
          color: COLORS.text,
          font: {
            size: 12
          },
          padding: 10,
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: COLORS.text,
          font: {
            size: 12
          },
          padding: 10,
        }
      }
    },
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: COLORS.text,
          font: {
            size: 14,
            weight: '500',
          },
          padding: 20,
          boxWidth: 15,
          boxHeight: 15,
        }
      },
      title: {
        display: true,
        text: 'Portfolio Distribution',
        font: {
          size: 18,
          weight: 'bold',
          color: COLORS.text,
        },
        padding: {
          top: 20,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: COLORS.card,
        titleColor: COLORS.text,
        bodyColor: COLORS.text,
        borderColor: COLORS.border,
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: COLORS.text,
          font: {
            size: 14,
            weight: '500',
          },
          padding: 20,
          boxWidth: 15,
          boxHeight: 15,
        }
      },
      title: {
        display: true,
        text: 'Holdings vs Market Comparison',
        font: {
          size: 18,
          weight: 'bold',
          color: COLORS.text,
        },
        padding: {
          top: 20,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: COLORS.card,
        titleColor: COLORS.text,
        bodyColor: COLORS.text,
        borderColor: COLORS.border,
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
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
        beginAtZero: true,
        grid: {
          color: COLORS.chart.grid,
          drawBorder: false,
        },
        ticks: {
          color: COLORS.text,
          font: {
            size: 12
          },
          padding: 10,
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: COLORS.text,
          font: {
            size: 12
          },
          padding: 10,
        }
      }
    }
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

        {/* Performance Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="p-6 rounded-lg shadow-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <p className="text-sm font-medium" style={{ color: COLORS.text }}>Best Performer</p>
            <div className="flex items-center mt-2">
              <span className="text-lg font-semibold" style={{ color: COLORS.success }}>
                {performanceMetrics.bestPerformer.symbol}
              </span>
              <span className="ml-2 text-sm" style={{ color: COLORS.success }}>
                +{performanceMetrics.bestPerformer.change.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="p-6 rounded-lg shadow-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <p className="text-sm font-medium" style={{ color: COLORS.text }}>Worst Performer</p>
            <div className="flex items-center mt-2">
              <span className="text-lg font-semibold" style={{ color: COLORS.danger }}>
                {performanceMetrics.worstPerformer.symbol}
              </span>
              <span className="ml-2 text-sm" style={{ color: COLORS.danger }}>
                {performanceMetrics.worstPerformer.change.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="p-6 rounded-lg shadow-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <p className="text-sm font-medium" style={{ color: COLORS.text }}>Total Gain</p>
            <p className="text-lg font-semibold mt-2" style={{ color: COLORS.success }}>
              +{performanceMetrics.totalGain.toFixed(2)}%
            </p>
          </div>
          <div className="p-6 rounded-lg shadow-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <p className="text-sm font-medium" style={{ color: COLORS.text }}>Total Loss</p>
            <p className="text-lg font-semibold mt-2" style={{ color: COLORS.danger }}>
              -{performanceMetrics.totalLoss.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Price Forecast Chart */}
          <div className="p-6 rounded-lg shadow-sm" style={{ 
            background: COLORS.card, 
            border: `1px solid ${COLORS.border}`,
            height: '500px'
          }}>
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Portfolio Distribution Chart */}
          <div className="p-6 rounded-lg shadow-sm" style={{ 
            background: COLORS.card, 
            border: `1px solid ${COLORS.border}`,
            height: '500px'
          }}>
            <Pie data={portfolioDistribution} options={pieOptions} />
          </div>

          {/* Holdings vs Market Comparison Chart */}
          <div className="p-6 rounded-lg shadow-sm col-span-1 lg:col-span-2" style={{ 
            background: COLORS.card, 
            border: `1px solid ${COLORS.border}`,
            height: '500px'
          }}>
            <Bar data={comparisonData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
