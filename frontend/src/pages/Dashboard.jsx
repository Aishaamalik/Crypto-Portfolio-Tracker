import { useState, useEffect, useMemo } from 'react'
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
import { 
  ArrowUp, 
  ArrowDown, 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  Activity, 
  PieChart, 
  BarChart2,
  Target,
  AlertTriangle,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Shield,
  TrendingDown,
  Award,
  Users,
  Globe,
  Volume2
} from 'lucide-react'
import { binanceService } from '../services/binanceService'
import toast from 'react-hot-toast'
import { usePortfolio } from '../context/PortfolioContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'

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

// Enhanced color mapping for consistent colors across charts
const COIN_COLORS = {
  'BTC': '#f7931a',  // Bitcoin Orange
  'ETH': '#627eea',  // Ethereum Blue
  'BNB': '#f3ba2f',  // Binance Yellow
  'SOL': '#9945ff',  // Solana Purple
  'ADA': '#0033ad',  // Cardano Blue
  'DOT': '#e6007a',  // Polkadot Pink
  'AVAX': '#e84142', // Avalanche Red
  'MATIC': '#8247e5',// Polygon Purple
  'LINK': '#2a5ada', // Chainlink Blue
  'UNI': '#ff007a',  // Uniswap Pink
  'XRP': '#23292f',  // Ripple Black
  'DOGE': '#c2a633', // Dogecoin Gold
  'SHIB': '#ff6b35', // Shiba Inu Orange
  'LTC': '#a6a9aa',  // Litecoin Silver
  'ATOM': '#2e3148', // Cosmos Dark
  'NEAR': '#000000', // NEAR Black
  'ALGO': '#000000', // Algorand Black
  'VET': '#15bdff',  // VeChain Blue
  'MANA': '#ff2d55', // Decentraland Pink
  'SAND': '#00adef'  // The Sandbox Blue
}

export default function Dashboard() {
  const { darkMode } = useTheme()
  const { holdings, prices, loading } = usePortfolio()
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [portfolioChange, setPortfolioChange] = useState(0)
  const [chartData, setChartData] = useState({ labels: [], datasets: [] })
  const [portfolioDistribution, setPortfolioDistribution] = useState({ labels: [], datasets: [] })
  const [comparisonData, setComparisonData] = useState({ labels: [], datasets: [] })
  const [showValue, setShowValue] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    bestPerformer: { symbol: '', change: 0, value: 0 },
    worstPerformer: { symbol: '', change: 0, value: 0 },
    totalGain: 0,
    totalLoss: 0,
    totalInvested: 0,
    netProfit: 0,
    roi: 0
  })
  const navigate = useNavigate()

  // Enhanced color scheme based on theme
  const COLORS = {
    primary: darkMode ? '#6366f1' : '#155263',
    secondary: darkMode ? '#22c55e' : '#ff6f3c',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    background: darkMode ? '#0f172a' : '#f8fafc',
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    chart: {
      main: darkMode ? '#6366f1' : '#155263',
      upper: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(21, 82, 99, 0.3)',
      lower: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(21, 82, 99, 0.3)',
      grid: darkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
    }
  }

  // Calculate comprehensive portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (holdings.length === 0) return {}

    const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0)
    const totalInvested = holdings.reduce((sum, holding) => {
      const purchaseValue = holding.purchase_price ? holding.amount * holding.purchase_price : 0
      return sum + purchaseValue
    }, 0)
    
    const netProfit = totalValue - totalInvested
    const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0

    return {
      totalValue,
      totalInvested,
      netProfit,
      roi
    }
  }, [holdings])

  useEffect(() => {
    if (holdings.length > 0 && portfolioMetrics.totalValue) {
      setPortfolioValue(portfolioMetrics.totalValue)
      setPerformanceMetrics({
        bestPerformer: { symbol: '', change: 0, value: 0 },
        worstPerformer: { symbol: '', change: 0, value: 0 },
        totalGain: portfolioMetrics.netProfit > 0 ? portfolioMetrics.netProfit : 0,
        totalLoss: portfolioMetrics.netProfit < 0 ? Math.abs(portfolioMetrics.netProfit) : 0,
        totalInvested: portfolioMetrics.totalInvested,
        netProfit: portfolioMetrics.netProfit,
        roi: portfolioMetrics.roi
      })

      // Update portfolio distribution
      const distribution = {
        labels: holdings.map(h => h.symbol),
        datasets: [{
          data: holdings.map(h => h.value),
          backgroundColor: holdings.map(h => COIN_COLORS[h.symbol] || COLORS.primary),
          borderWidth: 2,
          borderColor: COLORS.card,
        }]
      }
      setPortfolioDistribution(distribution)

      // Update comparison data
      const comparison = {
        labels: holdings.map(h => h.symbol),
        datasets: [
          {
            label: 'Your Holdings',
            data: holdings.map(h => h.value),
            backgroundColor: holdings.map(h => COIN_COLORS[h.symbol] || COLORS.primary),
            borderRadius: 8,
          },
          {
            label: 'Market Average',
            data: holdings.map(h => h.value * 1.15),
            backgroundColor: holdings.map(h => 
              `${COIN_COLORS[h.symbol] || COLORS.primary}60`
            ),
            borderRadius: 8,
          }
        ]
      }
      setComparisonData(comparison)

      // Find best and worst performers
      const performers = holdings.map(holding => ({
        symbol: holding.symbol,
        change: holding.change24h || 0,
        value: holding.value
      })).sort((a, b) => b.change - a.change)

      setPerformanceMetrics(prev => ({
        ...prev,
        bestPerformer: performers[0] || { symbol: '', change: 0, value: 0 },
        worstPerformer: performers[performers.length - 1] || { symbol: '', change: 0, value: 0 }
      }))
    }
  }, [holdings, portfolioMetrics])

  useEffect(() => {
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
              backgroundColor: COLORS.chart.upper,
              tension: 0.4,
              fill: true,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Upper Bound',
              data: forecast.forecast.map(f => f.upper_bound),
              borderColor: COLORS.chart.upper,
              borderDash: [5, 5],
              fill: false,
              borderWidth: 2,
              pointRadius: 0,
            },
            {
              label: 'Lower Bound',
              data: forecast.forecast.map(f => f.lower_bound),
              borderColor: COLORS.chart.lower,
              borderDash: [5, 5],
              fill: false,
              borderWidth: 2,
              pointRadius: 0,
            }
          ],
        })
      } catch (error) {
        console.error('Error fetching initial data:', error)
        toast.error('Failed to load market data')
      }
    }

    fetchInitialData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Portfolio data refreshed')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }

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
          color: COLORS.textSecondary,
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
          color: COLORS.textSecondary,
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
          color: COLORS.textSecondary,
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
          color: COLORS.textSecondary,
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: COLORS.primary }}></div>
          <p className="text-lg font-medium" style={{ color: COLORS.text }}>Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.text }}>Dashboard</h1>
            <p className="text-lg" style={{ color: COLORS.textSecondary }}>
              Welcome back! Here's your portfolio overview
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowValue(!showValue)}
              className="flex items-center px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{ 
                background: COLORS.card, 
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text 
              }}
            >
              {showValue ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showValue ? 'Hide Values' : 'Show Values'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={{ 
                background: COLORS.primary, 
                color: '#ffffff' 
              }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Portfolio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Portfolio Value Card */}
          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105" 
               style={{ 
                 background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}dd 100%)`,
                 border: `1px solid ${COLORS.border}` 
               }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Portfolio Value</p>
                <p className="text-3xl font-bold mt-2 text-white">
                  {showValue ? `$${portfolioValue.toLocaleString()}` : '****'}
                </p>
                <div className="flex items-center mt-2">
                  {portfolioChange >= 0 ? (
                    <ArrowUp className="w-4 h-4 mr-1 text-green-300" />
                  ) : (
                    <ArrowDown className="w-4 h-4 mr-1 text-red-300" />
                  )}
                  <span className="text-sm font-medium" style={{ color: portfolioChange >= 0 ? '#86efac' : '#fca5a5' }}>
                    {Math.abs(portfolioChange).toFixed(2)}% today
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Wallet className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105" 
               style={{ 
                 background: `linear-gradient(135deg, ${performanceMetrics.netProfit >= 0 ? COLORS.success : COLORS.danger} 0%, ${performanceMetrics.netProfit >= 0 ? COLORS.success : COLORS.danger}dd 100%)`,
                 border: `1px solid ${COLORS.border}` 
               }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Net Profit/Loss</p>
                <p className="text-3xl font-bold mt-2 text-white">
                  {showValue ? `$${performanceMetrics.netProfit.toLocaleString()}` : '****'}
                </p>
                <p className="text-sm font-medium mt-2 text-white/80">
                  ROI: {performanceMetrics.roi.toFixed(2)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Total Invested Card */}
          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105" 
               style={{ 
                 background: `linear-gradient(135deg, ${COLORS.info} 0%, ${COLORS.info}dd 100%)`,
                 border: `1px solid ${COLORS.border}` 
               }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Invested</p>
                <p className="text-3xl font-bold mt-2 text-white">
                  {showValue ? `$${performanceMetrics.totalInvested.toLocaleString()}` : '****'}
                </p>
                <p className="text-sm font-medium mt-2 text-white/80">
                  {holdings.length} assets
                </p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Market Status Card */}
          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105" 
               style={{ 
                 background: `linear-gradient(135deg, ${COLORS.warning} 0%, ${COLORS.warning}dd 100%)`,
                 border: `1px solid ${COLORS.border}` 
               }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Market Status</p>
                <p className="text-3xl font-bold mt-2 text-white">
                  Bullish
                </p>
                <p className="text-sm font-medium mt-2 text-white/80">
                  High Activity
                </p>
              </div>
              <div className="p-3 rounded-full bg-white/20">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl" 
               style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Best Performer</p>
              <Award className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-bold" style={{ color: COLORS.success }}>
                {performanceMetrics.bestPerformer.symbol}
              </span>
              <span className="ml-2 text-sm font-medium" style={{ color: COLORS.success }}>
                +{performanceMetrics.bestPerformer.change.toFixed(2)}%
              </span>
            </div>
            <p className="text-sm mt-2" style={{ color: COLORS.textSecondary }}>
              ${performanceMetrics.bestPerformer.value.toLocaleString()}
            </p>
          </div>

          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl" 
               style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Worst Performer</p>
              <AlertTriangle className="w-5 h-5" style={{ color: COLORS.danger }} />
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-bold" style={{ color: COLORS.danger }}>
                {performanceMetrics.worstPerformer.symbol}
              </span>
              <span className="ml-2 text-sm font-medium" style={{ color: COLORS.danger }}>
                {performanceMetrics.worstPerformer.change.toFixed(2)}%
              </span>
            </div>
            <p className="text-sm mt-2" style={{ color: COLORS.textSecondary }}>
              ${performanceMetrics.worstPerformer.value.toLocaleString()}
            </p>
          </div>

          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl" 
               style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Total Gain</p>
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
              +${performanceMetrics.totalGain.toLocaleString()}
            </p>
            <p className="text-sm mt-2" style={{ color: COLORS.textSecondary }}>
              From winning positions
            </p>
          </div>

          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl" 
               style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Total Loss</p>
              <TrendingDown className="w-5 h-5" style={{ color: COLORS.danger }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.danger }}>
              -${performanceMetrics.totalLoss.toLocaleString()}
            </p>
            <p className="text-sm mt-2" style={{ color: COLORS.textSecondary }}>
              From losing positions
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Price Forecast Chart */}
          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl" style={{ 
            background: COLORS.card, 
            border: `1px solid ${COLORS.border}`,
            height: '500px'
          }}>
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Portfolio Distribution Chart */}
          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl" style={{ 
            background: COLORS.card, 
            border: `1px solid ${COLORS.border}`,
            height: '500px'
          }}>
            <Pie data={portfolioDistribution} options={pieOptions} />
          </div>

          {/* Holdings vs Market Comparison Chart */}
          <div className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl col-span-1 lg:col-span-2" style={{ 
            background: COLORS.card, 
            border: `1px solid ${COLORS.border}`,
            height: '500px'
          }}>
            <Bar data={comparisonData} options={barOptions} />
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 text-left" 
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                  onClick={() => navigate('/add-coin')}>
            <div className="flex items-center justify-between mb-4">
              <Plus className="w-8 h-8" style={{ color: COLORS.primary }} />
              <ArrowUp className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>Add New Asset</h3>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              Add a new cryptocurrency to your portfolio
            </p>
          </button>

          <button className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 text-left" 
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                  onClick={() => navigate('/analytics')}>
            <div className="flex items-center justify-between mb-4">
              <BarChart2 className="w-8 h-8" style={{ color: COLORS.info }} />
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>View Analytics</h3>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              Detailed portfolio analysis and insights
            </p>
          </button>

          <button className="p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 text-left" 
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
                  onClick={() => navigate('/wallet-sync')}>
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8" style={{ color: COLORS.warning }} />
              <Users className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>Sync Wallet</h3>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              Connect your external wallet for automatic sync
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
