'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  TrendingUp, 
  Coins, 
  Percent,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Zap,
  Shield,
  Clock,
  DollarSign,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface Pool {
  id: string;
  name: string;
  token0: string;
  token1: string;
  tvl: number;
  apr: number;
  volume24h: number;
  fees24h: number;
}

interface LendingPool {
  id: string;
  asset: string;
  totalSupply: number;
  totalBorrow: number;
  supplyAPY: number;
  borrowAPY: number;
  utilization: number;
}

interface YieldFarm {
  id: string;
  name: string;
  tokens: string[];
  apy: number;
  tvl: number;
  rewards: string[];
  lockPeriod: string;
  status: 'active' | 'ended';
  autoCompound: boolean;
  audited: boolean;
  rewardToken: string;
}

const DeFiPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'lending' | 'yield'>('swap');
  const [swapFrom, setSwapFrom] = useState('');
  const [swapTo, setSwapTo] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('MRT');

  const mockPools: Pool[] = [
    {
      id: '1',
      name: 'MRT/ETH',
      token0: 'MRT',
      token1: 'ETH',
      tvl: 2500000,
      apr: 24.5,
      volume24h: 125000,
      fees24h: 375
    },
    {
      id: '2',
      name: 'MRT/USDC',
      token0: 'MRT',
      token1: 'USDC',
      tvl: 1800000,
      apr: 18.2,
      volume24h: 89000,
      fees24h: 267
    },
    {
      id: '3',
      name: 'ETH/USDC',
      token0: 'ETH',
      token1: 'USDC',
      tvl: 5200000,
      apr: 12.8,
      volume24h: 456000,
      fees24h: 1368
    }
  ];

  const mockLendingPools: LendingPool[] = [
    {
      id: '1',
      asset: 'MRT',
      totalSupply: 1250000,
      totalBorrow: 875000,
      supplyAPY: 8.5,
      borrowAPY: 12.3,
      utilization: 70
    },
    {
      id: '2',
      asset: 'ETH',
      totalSupply: 2800,
      totalBorrow: 1960,
      supplyAPY: 6.2,
      borrowAPY: 9.8,
      utilization: 70
    },
    {
      id: '3',
      asset: 'USDC',
      totalSupply: 3500000,
      totalBorrow: 2450000,
      supplyAPY: 4.8,
      borrowAPY: 7.2,
      utilization: 70
    }
  ];

  const mockYieldFarms: YieldFarm[] = [
    {
      id: '1',
      name: 'MRT-ETH LP',
      tokens: ['MRT', 'ETH'],
      apy: 45.6,
      tvl: 1200000,
      rewards: ['MRT', 'MUSIC'],
      lockPeriod: '30 days',
      status: 'active',
      autoCompound: true,
      audited: true,
      rewardToken: 'MRT'
    },
    {
      id: '2',
      name: 'MRT Single Staking',
      tokens: ['MRT'],
      apy: 28.3,
      tvl: 850000,
      rewards: ['MRT'],
      lockPeriod: '7 days',
      status: 'active',
      autoCompound: false,
      audited: true,
      rewardToken: 'MRT'
    },
    {
      id: '3',
      name: 'MUSIC Governance Staking',
      tokens: ['MUSIC'],
      apy: 35.7,
      tvl: 650000,
      rewards: ['MUSIC', 'MRT'],
      lockPeriod: '90 days',
      status: 'ended',
      autoCompound: true,
      audited: false,
      rewardToken: 'MUSIC'
    }
  ];

  const tabs = [
    { id: 'swap', label: 'Swap', icon: ArrowUpDown },
    { id: 'liquidity', label: 'Liquidity', icon: Coins },
    { id: 'lending', label: 'Lending', icon: Percent },
    { id: 'yield', label: 'Yield Farming', icon: TrendingUp },
  ];

  const defiStats = [
    { 
      label: 'Total Value Locked', 
      value: '$12.5M', 
      change: '+8.2%',
      icon: DollarSign, 
      color: 'from-green-500 to-green-600'
    },
    { 
      label: '24h Trading Volume', 
      value: '$2.8M', 
      change: '+15.7%',
      icon: BarChart3, 
      color: 'from-blue-500 to-blue-600'
    },
    { 
      label: 'Liquidity Providers', 
      value: '1,247', 
      change: '+5.3%',
      icon: Coins, 
      color: 'from-purple-500 to-purple-600'
    },
    { 
      label: 'Average APY', 
      value: '24.8%', 
      change: '+2.1%',
      icon: TrendingUp, 
      color: 'from-orange-500 to-orange-600'
    },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            DeFi Protocol
          </h1>
          <p className="text-gray-400">
            Decentralized financial services: trading, liquidity mining, lending and yield aggregation
          </p>
        </motion.div>

        {/* DeFi Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {defiStats.map((stat, index) => (
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
                      <div className="flex items-center text-sm text-green-400">
                        <ArrowUp className="w-4 h-4 mr-1" />
                        <span>{stat.change}</span>
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

        {/* Swap Tab */}
        {activeTab === 'swap' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card variant="glass">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Token Swap</h3>
                <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                  Refresh
                </Button>
              </div>

              <div className="space-y-4">
                {/* From Token */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">From</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={swapFrom}
                      onChange={(e) => setSwapFrom(e.target.value)}
                      className="pr-20"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <select 
                        value={fromToken}
                        onChange={(e) => setFromToken(e.target.value)}
                        className="bg-gray-700 text-white rounded px-2 py-1 text-sm border-none outline-none"
                      >
                        <option value="ETH">ETH</option>
                        <option value="MRT">MRT</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Balance: 2.5 {fromToken}</div>
                </div>

                {/* Swap Arrow */}
                <div className="flex justify-center">
                  <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                    <ArrowDown className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* To Token */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">To</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={swapTo}
                      onChange={(e) => setSwapTo(e.target.value)}
                      className="pr-20"
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <select 
                        value={toToken}
                        onChange={(e) => setToToken(e.target.value)}
                        className="bg-gray-700 text-white rounded px-2 py-1 text-sm border-none outline-none"
                      >
                        <option value="MRT">MRT</option>
                        <option value="ETH">ETH</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Balance: 1,250 {toToken}</div>
                </div>

                {/* Swap Details */}
                <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Exchange Rate</span>
                    <span className="text-white">1 ETH = 2,500 MRT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Slippage Tolerance</span>
                    <span className="text-white">0.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Fee</span>
                    <span className="text-white">0.3%</span>
                  </div>
                </div>

                <Button variant="primary" className="w-full" size="lg">
                  Swap Tokens
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Liquidity Tab */}
        {activeTab === 'liquidity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Liquidity Pools</h3>
              <Button variant="primary" leftIcon={<Coins className="w-4 h-4" />}>
                Add Liquidity
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockPools.map((pool) => (
                <Card key={pool.id} variant="glass" hover>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{pool.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-6 h-6 bg-primary-500 rounded-full"></div>
                        <div className="w-6 h-6 bg-secondary-500 rounded-full -ml-2"></div>
                        <span className="text-gray-400 text-sm ml-2">{pool.token0}/{pool.token1}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-semibold">{pool.apr}% APR</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">TVL</span>
                      <span className="text-white">${pool.tvl.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">24h Volume</span>
                      <span className="text-white">${pool.volume24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">24h Fees</span>
                      <span className="text-white">${pool.fees24h.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-6">
                    <Button variant="primary" size="sm" className="flex-1">
                      Add Liquidity
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Remove Liquidity
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lending Tab */}
        {activeTab === 'lending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-white">Lending Market</h3>

            <Card variant="glass">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Asset</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Total Supply</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Total Borrow</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Supply APY</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Borrow APY</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Utilization</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLendingPools.map((pool) => (
                      <tr key={pool.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">{pool.asset.charAt(0)}</span>
                            </div>
                            <span className="text-white font-medium">{pool.asset}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300">{pool.totalSupply.toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-300">{pool.totalBorrow.toLocaleString()}</td>
                        <td className="py-4 px-4 text-green-400">{pool.supplyAPY}%</td>
                        <td className="py-4 px-4 text-orange-400">{pool.borrowAPY}%</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="w-16 h-2 bg-gray-700 rounded-full mr-2">
                              <div 
                                className="h-full bg-primary-500 rounded-full" 
                                style={{ width: `${pool.utilization}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-300 text-sm">{pool.utilization}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button variant="primary" size="sm">
                              Supply
                            </Button>
                            <Button variant="outline" size="sm">
                              Borrow
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Yield Farming Tab */}
        {activeTab === 'yield' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-white">Yield Aggregator</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockYieldFarms.map((farm) => (
                <Card key={farm.id} variant="glass">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{farm.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            farm.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {farm.status === 'active' ? 'Active' : 'Ended'}
                          </span>
                          {farm.autoCompound && (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                              Auto Compound
                            </span>
                          )}
                          {farm.audited && (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                              Audited
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{farm.apy}%</div>
                        <div className="text-gray-400 text-sm">APY</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">TVL</span>
                        <span className="text-white">${farm.tvl.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lock Period</span>
                        <span className="text-white">{farm.lockPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reward Token</span>
                        <span className="text-white">{farm.rewardToken}</span>
                      </div>
                    </div>

                    <Button 
                      variant="primary" 
                      className="w-full"
                      disabled={farm.status !== 'active'}
                    >
                      Start Mining
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DeFiPage;