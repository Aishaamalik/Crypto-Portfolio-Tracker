import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar takes 1/3 of the screen */}
      <div className="w-1/3">
        <Sidebar />
      </div>
      
      {/* Main content area takes 2/3 of the screen */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
} 