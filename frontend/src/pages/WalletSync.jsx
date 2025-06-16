import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WalletSync() {
  const navigate = useNavigate()
  const [walletAddress, setWalletAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncedWallets, setSyncedWallets] = useState([
    {
      id: 1,
      address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      type: 'Ethereum',
      lastSynced: '2024-01-15T10:30:00Z',
    },
  ])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newWallet = {
        id: syncedWallets.length + 1,
        address: walletAddress,
        type: 'Ethereum', // This would be determined by the address format
        lastSynced: new Date().toISOString(),
      }

      setSyncedWallets([...syncedWallets, newWallet])
      setWalletAddress('')
      toast.success('Wallet synced successfully')
    } catch (error) {
      toast.error('Failed to sync wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveWallet = (id) => {
    setSyncedWallets(syncedWallets.filter((wallet) => wallet.id !== id))
    toast.success('Wallet removed successfully')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Wallet Sync</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Wallet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="walletAddress"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Wallet Address
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex items-stretch flex-grow">
                <input
                  type="text"
                  id="walletAddress"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  required
                  className="block w-full rounded-l-md border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter wallet address"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Syncing...' : 'Sync Wallet'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Synced Wallets</h2>
        <div className="space-y-4">
          {syncedWallets.map((wallet) => (
            <div
              key={wallet.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Wallet className="h-6 w-6 text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {wallet.type} Wallet
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{wallet.address}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Last synced: {new Date(wallet.lastSynced).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRemoveWallet(wallet.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
                <button className="text-primary-500 hover:text-primary-600">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 