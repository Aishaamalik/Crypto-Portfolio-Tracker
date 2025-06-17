import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PieChart, PlusCircle, Wallet } from 'lucide-react'
import { COLORS } from '../theme/colors'

const navLinks = [
  { name: 'Dashboard', to: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
  { name: 'Portfolio', to: '/portfolio', icon: <PieChart className="h-5 w-5" /> },
  { name: 'Add Coin', to: '/add-coin', icon: <PlusCircle className="h-5 w-5" /> },
  { name: 'Wallet Sync', to: '/wallet-sync', icon: <Wallet className="h-5 w-5" /> },
]

export default function Sidebar() {
  return (
    <aside className="w-full bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto">
        {/* Branding */}
        <div className="flex items-center justify-between h-20 px-6">
          <div className="flex items-center space-x-3">
            <span role="img" aria-label="logo" className="text-3xl">🚀</span>
            <span className="text-2xl font-bold text-white tracking-tight">Crypto Tracker</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-4">
          <nav className="flex items-center space-x-1">
            {navLinks.map(link => (
              <NavLink
                key={link.name}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white text-blue-700 shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`
                }
              >
                <span className="mr-2">{link.icon}</span>
                {link.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  )
} 