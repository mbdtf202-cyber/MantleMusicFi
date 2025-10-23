'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  PieChart, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Music,
  Star,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface Investment {
  id: string;
  trackTitle: string;
  artist: string;
  mrtTokens: number;
  investmentAmount: number;
  currentValue: number;
  dailyReturn: number;
  totalReturn: number;
  returnPercentage: number;
  status: 'active' | 'matured' | 'pending';
}

interface MarketTrack {
  id: string;
  title: string;
  artist: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  rating: number;
}

const InvestorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'market' | 'analytics'>('portfolio');
  const [searchTerm, setSearchTerm] = useState('');

  const mockInvestments: Investment[] = [
    {
      id: '1',
      trackTitle: 'Brightest Star in the Night Sky',
      artist: 'Escape Plan',
      mrtTokens: 500,
      investmentAmount: 2500,
      currentValue: 2875,
      dailyReturn: 25,
      totalReturn: 375,
      returnPercentage: 15.0,
      status: 'active'
    },
    {
      id: '2',
      trackTitle: 'People Like Me',
      artist: 'Mao Buyi',
      mrtTokens: 300,
      investmentAmount: 1800,
      currentValue: 1980,
      dailyReturn: 12,
      totalReturn: 180,
      returnPercentage: 10.0,
      status: 'active'
    },
    {
      id: '3',
      trackTitle: 'Chengdu',
      artist: 'Zhao Lei',
      mrtTokens: 750,
      investmentAmount: 4200,
      currentValue: 3990,
      dailyReturn: -15,
      totalReturn: -210,
      returnPercentage: -5.0,
      status: 'active'
    }
  ];

  const mockMarketTracks: MarketTrack[] = [
    {
      id: '1',
      title: 'Youth',
      artist: 'Mao Buyi',
      price: 6.25,
      change24h: 8.5,
      volume24h: 125000,
      marketCap: 850000,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Nanshan South',
      artist: 'Ma Di',
      price: 12.80,
      change24h: -3.2,
      volume24h: 89000,
      marketCap: 1200000,
      rating: 4.6
    },
    {
      id: '3',
      title: 'Ideal',
      artist: 'Zhao Lei',
      price: 9.45,
      change24h: 15.7,
      volume24h: 156000,
      marketCap: 980000,
      rating: 4.9
    }
  ];

  const portfolioStats = [
    { 
      label: 'Total Investment Value', 
      value: '$8,845', 
      change: '+$345', 
      changePercent: '+4.1%',
      icon: DollarSign, 
      color: 'from-green-500 to-green-600',
      isPositive: true
    },
    { 
      label: 'Daily Return', 
      value: '+$22', 
      change: '+0.25%', 
      changePercent: '',
      icon: TrendingUp, 
      color: 'from-blue-500 to-blue-600',
      isPositive: true
    },
    { 
      label: 'MRT Holdings', 
      value: '1,550', 
      change: '+50', 
      changePercent: '+3.3%',
      icon: PieChart, 
      color: 'from-purple-500 to-purple-600',
      isPositive: true
    },
    { 
      label: 'Portfolio Count', 
      value: '12', 
      change: '+2', 
      changePercent: '',
      icon: BarChart3, 
      color: 'from-orange-500 to-orange-600',
      isPositive: true
    },
  ];

  const tabs = [
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const totalInvestment = mockInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const totalCurrentValue = mockInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturn = totalCurrentValue - totalInvestment;
  const totalReturnPercentage = (totalReturn / totalInvestment) * 100;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                Investment Dashboard
              </h1>
              <p className="text-gray-400">
                Manage your MRT investment portfolio and track performance
              </p>
            </div>
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh Data
            </Button>
          </div>
        </motion.div>

        {/* Portfolio Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {portfolioStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                      <div className={`flex items-center text-sm ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {stat.isPositive ? (
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 mr-1" />
                        )}
                        <span>{stat.change} {stat.changePercent}</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Portfolio Summary */}
            <Card variant="gradient">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    ${totalInvestment.toLocaleString()}
                  </div>
                  <div className="text-gray-300">Total Investment Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    ${totalCurrentValue.toLocaleString()}
                  </div>
                  <div className="text-gray-300">Current Value</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString()}
                  </div>
                  <div className="text-gray-300">
                    Total Return ({totalReturnPercentage >= 0 ? '+' : ''}{totalReturnPercentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </Card>

            {/* Investment List */}
            <Card variant="glass">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">My Investments</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
                    Filter
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Track</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">MRT Amount</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Investment Amount</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Current Value</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Daily Return</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Total Return</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvestments.map((investment) => (
                      <tr key={investment.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                              <Music className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{investment.trackTitle}</div>
                              <div className="text-gray-400 text-sm">{investment.artist}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300">{investment.mrtTokens}</td>
                        <td className="py-4 px-4 text-gray-300">${investment.investmentAmount.toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-300">${investment.currentValue.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <div className={`flex items-center ${investment.dailyReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {investment.dailyReturn >= 0 ? (
                              <ArrowUpRight className="w-4 h-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 mr-1" />
                            )}
                            ${Math.abs(investment.dailyReturn)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className={investment.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {investment.totalReturn >= 0 ? '+' : ''}${investment.totalReturn}
                            <div className="text-xs">
                              ({investment.returnPercentage >= 0 ? '+' : ''}{investment.returnPercentage.toFixed(1)}%)
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            investment.status === 'active' ? 'text-green-400 bg-green-400/20' :
                            investment.status === 'matured' ? 'text-blue-400 bg-blue-400/20' :
                            'text-yellow-400 bg-yellow-400/20'
                          }`}>
                            {investment.status === 'active' ? 'Active' :
                         investment.status === 'matured' ? 'Matured' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <Card variant="glass">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search tracks or artists..."
                    leftIcon={<Search className="w-4 h-4" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Popular
                  </Button>
                  <Button variant="outline" size="sm">
                    New Listed
                  </Button>
                  <Button variant="outline" size="sm">
                    High Yield
                  </Button>
                </div>
              </div>
            </Card>

            {/* Market List */}
            <Card variant="glass">
              <h3 className="text-xl font-semibold text-white mb-6">Market Trends</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Track</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Price</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">24h Change</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">24h Volume</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Market Cap</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Rating</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMarketTracks.map((track) => (
                      <tr key={track.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                              <Music className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{track.title}</div>
                              <div className="text-gray-400 text-sm">{track.artist}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300">${track.price.toFixed(2)}</td>
                        <td className="py-4 px-4">
                          <div className={`flex items-center ${track.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {track.change24h >= 0 ? (
                              <ArrowUpRight className="w-4 h-4 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 mr-1" />
                            )}
                            {Math.abs(track.change24h).toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300">${track.volume24h.toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-300">${track.marketCap.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-gray-300">{track.rating}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="primary" size="sm">
                            Invest
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass">
                <h4 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h4>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Portfolio chart will be displayed here</p>
                  </div>
                </div>
              </Card>

              <Card variant="glass">
                <h4 className="text-lg font-semibold text-white mb-4">Return Distribution</h4>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Return distribution chart will be displayed here</p>
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="lg:col-span-2">
                <h4 className="text-lg font-semibold text-white mb-4">Market Trends</h4>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Market trends chart will be displayed here</p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InvestorDashboard;