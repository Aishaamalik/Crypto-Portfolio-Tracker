import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PieChart, PlusCircle, Wallet } from 'lucide-react'

const navLinks = [
  { name: 'Dashboard', to: '/', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
  { name: 'Portfolio', to: '/portfolio', icon: <PieChart className="h-5 w-5 mr-3" /> },
  { name: 'Add Coin', to: '/add-coin', icon: <PlusCircle className="h-5 w-5 mr-3" /> },
  { name: 'Wallet Sync', to: '/wallet-sync', icon: <Wallet className="h-5 w-5 mr-3" /> },
]

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-blue-600 text-white flex flex-col shadow-lg transition-transform duration-300 min-h-screen">
      {/* Branding */}
      <div className="flex items-center justify-center h-55 px-6 font-extrabold text-4xl tracking-wide border-b border-blue-700 select-none">
        <span role="img" aria-label="logo" className="mr-3 text-5xl">🚀</span>
        <span className="text-center">Crypto Tracker</span>
      </div>
      <nav className="flex-1 py-6 px-2 space-y-2">
        {navLinks.map(link => (
          <NavLink
            key={link.name}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-blue-700/80 hover:text-yellow-300 ${
                isActive ? 'bg-white text-blue-700 shadow font-bold' : 'text-white'
              }`
            }
          >
            {link.icon}
            {link.name}
          </NavLink>
        ))}
      </nav>
      {/* Footer or collapse button for mobile can go here */}
    </aside>
  )
} 