import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import AddCoin from './pages/AddCoin'
import WalletSync from './pages/WalletSync'
import Analytics from './pages/Analytics'
import { ThemeProvider } from './context/ThemeContext'
import { PortfolioProvider } from './context/PortfolioContext'

function App() {
  return (
    <ThemeProvider>
      <PortfolioProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/add-coin" element={<AddCoin />} />
                <Route path="/wallet-sync" element={<WalletSync />} />
                <Route path="/analytics" element={<Analytics />} />
              </Route>
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </PortfolioProvider>
    </ThemeProvider>
  )
}

export default App 