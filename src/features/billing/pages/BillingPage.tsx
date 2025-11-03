/**
 * Shop Billing Page
 *
 * @description Main billing page with balance, rentals, and transaction history
 * @route /shop/billing
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, AlertCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { useShopBalance } from '../hooks/useBilling';
import { ActiveRentals } from '../components/ActiveRentals';
import { TransactionHistory } from '../components/TransactionHistory';
import { Button } from '@/shared/components/ui/Button';
import { StatsCard } from '@/shared/components/ui/StatsCard';

export function BillingPage() {
  const { data: balance, isLoading } = useShopBalance();
  const [activeTab, setActiveTab] = useState<'rentals' | 'history'>('rentals');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Payments</h1>
        <p className="text-gray-600">
          Manage your shop balance, product rentals, and transaction history
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Current Balance</p>
                <h2 className="text-3xl font-bold">
                  {isLoading ? (
                    <div className="animate-pulse bg-white/20 h-9 w-32 rounded" />
                  ) : (
                    `${(balance?.current_balance ?? 0).toLocaleString()} KZT`
                  )}
                </h2>
              </div>
            </div>

            <Link to="/shop/billing/topup">
              <Button
                variant="outline"
                className="bg-white text-blue-600 hover:bg-blue-50 border-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Top Up
              </Button>
            </Link>
          </div>

          <div className="text-blue-100 text-sm">
            {balance?.currency || 'KZT'} • Available for use
          </div>
        </div>

        <StatsCard
          title="Pending Balance"
          value={`${(balance?.pending_balance ?? 0).toLocaleString()} KZT`}
          icon={<AlertCircle className="w-6 h-6" />}
          variant="warning"
          loading={isLoading}
        />

        <StatsCard
          title="Active Rentals"
          value={balance?.active_rentals_count || 0}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="info"
          loading={isLoading}
        />
      </div>

      {/* Additional Stats (smaller cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Earned</p>
              <p className="text-xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `${(balance?.total_earned ?? 0).toLocaleString()} KZT`
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-8 h-8 text-red-600 rotate-180" />
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `${(balance?.total_spent ?? 0).toLocaleString()} KZT`
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('rentals')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rentals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Rentals
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'rentals' && <ActiveRentals />}
          {activeTab === 'history' && <TransactionHistory />}
        </div>
      </div>
    </div>
  );
}

export default BillingPage;
