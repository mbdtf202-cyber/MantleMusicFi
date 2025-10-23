'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  Droplets, 
  PiggyBank, 
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  BarChart3
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { 
  defiService, 
  TradingPair, 
  LiquidityPool, 
  LendingPool, 
  YieldFarm, 
  DeFiStats,
  SwapQuote 
} from '@/services/defiService';

const DeFiPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'lending' | 'yield'>('swap');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // 数据状态
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [lendingPools, setLendingPools] = useState<LendingPool[]>([]);
  const [yieldFarms, setYieldFarms] = useState<YieldFarm[]>([]);
  const [defiStats, setDefiStats] = useState<DeFiStats | null>(null);
  
  // Swap 状态
  const [swapForm, setSwapForm] = useState({
    tokenIn: 'MRT',
    tokenOut: 'USDC',
    amountIn: '',
    slippage: 0.5
  });
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  
  // Liquidity 状态
  const [liquidityForm, setLiquidityForm] = useState({
    token0: 'MRT',
    token1: 'USDC',
    amount0: '',
    amount1: ''
  });
  
  // Lending 状态
  const [lendingForm, setLendingForm] = useState({
    asset: 'MRT',
    amount: '',
    action: 'supply' as 'supply' | 'borrow' | 'repay' | 'withdraw'
  });
  
  // Yield 状态
  const [yieldForm, setYieldForm] = useState({
    farmId: '',
    amount: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        tradingPairsData,
        liquidityPoolsData,
        lendingPoolsData,
        yieldFarmsData,
        statsData
      ] = await Promise.all([
        defiService.getTradingPairs(),
        defiService.getLiquidityPools(),
        defiService.getLendingPools(),
        defiService.getYieldFarms(),
        defiService.getDeFiStats()
      ]);

      setTradingPairs(tradingPairsData.pairs);
      setLiquidityPools(liquidityPoolsData.pools);
      setLendingPools(lendingPoolsData.pools);
      setYieldFarms(yieldFarmsData.farms);
      setDefiStats(statsData);
    } catch (error) {
      console.error('Failed to load DeFi data:', error);
      showNotification('error', 'Failed to load DeFi data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Swap 相关函数
  const getSwapQuote = async () => {
    if (!swapForm.amountIn || parseFloat(swapForm.amountIn) <= 0) return;
    
    try {
      const quote = await defiService.getSwapQuote(
        swapForm.tokenIn,
        swapForm.tokenOut,
        swapForm.amountIn
      );
      setSwapQuote(quote);
    } catch (error) {
      console.error('Failed to get swap quote:', error);
    }
  };

  const executeSwap = async () => {
    if (!swapForm.amountIn || !swapQuote) return;
    
    try {
      setActionLoading(true);
      const result = await defiService.executeSwap(
        swapForm.tokenIn,
        swapForm.tokenOut,
        swapForm.amountIn,
        swapForm.slippage
      );
      
      if (result.success) {
        showNotification('success', 'Swap executed successfully!');
        setSwapForm({ ...swapForm, amountIn: '' });
        setSwapQuote(null);
        loadAllData(); // 重新加载数据
      } else {
        showNotification('error', result.message || 'Swap failed');
      }
    } catch (error) {
      console.error('Swap error:', error);
      showNotification('error', 'Swap failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Liquidity 相关函数
  const addLiquidity = async () => {
    if (!liquidityForm.amount0 || !liquidityForm.amount1) return;
    
    try {
      setActionLoading(true);
      const result = await defiService.addLiquidity(
        liquidityForm.token0,
        liquidityForm.token1,
        liquidityForm.amount0,
        liquidityForm.amount1
      );
      
      if (result.success) {
        showNotification('success', 'Liquidity added successfully!');
        setLiquidityForm({ ...liquidityForm, amount0: '', amount1: '' });
        loadAllData();
      } else {
        showNotification('error', result.message || 'Add liquidity failed');
      }
    } catch (error) {
      console.error('Add liquidity error:', error);
      showNotification('error', 'Add liquidity failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Lending 相关函数
  const executeLendingAction = async () => {
    if (!lendingForm.amount) return;
    
    try {
      setActionLoading(true);
      let result;
      
      switch (lendingForm.action) {
        case 'supply':
          result = await defiService.supply(lendingForm.asset, lendingForm.amount);
          break;
        case 'borrow':
          result = await defiService.borrow(lendingForm.asset, lendingForm.amount);
          break;
        default:
          throw new Error('Unsupported action');
      }
      
      if (result.success) {
        showNotification('success', `${lendingForm.action} executed successfully!`);
        setLendingForm({ ...lendingForm, amount: '' });
        loadAllData();
      } else {
        showNotification('error', result.message || `${lendingForm.action} failed`);
      }
    } catch (error) {
      console.error('Lending action error:', error);
      showNotification('error', `${lendingForm.action} failed. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Yield 相关函数
  const stakeInFarm = async () => {
    if (!yieldForm.farmId || !yieldForm.amount) return;
    
    try {
      setActionLoading(true);
      const result = await defiService.stakeLp(yieldForm.farmId, yieldForm.amount);
      
      if (result.success) {
        showNotification('success', 'LP tokens staked successfully!');
        setYieldForm({ farmId: '', amount: '' });
        loadAllData();
      } else {
        showNotification('error', result.message || 'Stake failed');
      }
    } catch (error) {
      console.error('Stake error:', error);
      showNotification('error', 'Stake failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const claimRewards = async (farmId: string) => {
    try {
      setActionLoading(true);
      const result = await defiService.claimRewards(farmId);
      
      if (result.success) {
        showNotification('success', 'Rewards claimed successfully!');
        loadAllData();
      } else {
        showNotification('error', result.message || 'Claim failed');
      }
    } catch (error) {
      console.error('Claim error:', error);
      showNotification('error', 'Claim failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (swapForm.amountIn && parseFloat(swapForm.amountIn) > 0) {
      const timer = setTimeout(getSwapQuote, 500);
      return () => clearTimeout(timer);
    }
  }, [swapForm.amountIn, swapForm.tokenIn, swapForm.tokenOut]);

  const tabs = [
    { id: 'swap', label: 'Swap', icon: ArrowUpDown },
    { id: 'liquidity', label: 'Liquidity', icon: Droplets },
    { id: 'lending', label: 'Lending', icon: PiggyBank },
    { id: 'yield', label: 'Yield Farming', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-mantle-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading DeFi data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* 通知 */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            {/* 金融主题的独特logo设计 */}
            <div className="relative">
              {/* 主要logo容器 - 钻石形状设计 */}
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-blue-500 to-indigo-600 transform rotate-45 flex items-center justify-center shadow-2xl border-2 border-white/20">
                <TrendingUp className="w-8 h-8 text-white transform -rotate-45" />
              </div>
              {/* 金币装饰 */}
               <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-spin border-2 border-white/30" style={{animationDuration: '3s'}}>
                 <DollarSign className="w-4 h-4 text-white" />
               </div>
              {/* 光芒效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 via-blue-500/40 to-indigo-600/40 transform rotate-45 animate-pulse blur-sm"></div>
              {/* 数据流动效果 */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-1">
                <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                  DeFi
                </span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Decentralized Finance on Mantle Network</span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-lg">
            Trade, provide liquidity, lend, borrow and earn yield with music-backed tokens
          </p>
        </motion.div>

        {/* Stats Overview */}
        {defiStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card variant="glass">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-mantle-primary to-mantle-secondary rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">${(defiStats.totalValueLocked / 1000000).toFixed(1)}M</div>
                  <div className="text-gray-400 text-sm">Total Value Locked</div>
                </div>
              </div>
            </Card>
            <Card variant="glass">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-mantle-secondary to-mantle-accent rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">${(defiStats.totalVolume24h / 1000000).toFixed(1)}M</div>
                  <div className="text-gray-400 text-sm">24h Volume</div>
                </div>
              </div>
            </Card>
            <Card variant="glass">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-mantle-accent to-mantle-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">${defiStats.userPortfolioValue.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Your Portfolio</div>
                </div>
              </div>
            </Card>
            <Card variant="glass">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{defiStats.totalUsers.toLocaleString()}</div>
                  <div className="text-gray-400 text-sm">Total Users</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="glass-card p-2 rounded-xl">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 font-medium ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-mantle-primary to-mantle-secondary text-white neon-mantle'
                      : 'text-gray-300 hover:text-mantle-primary hover:bg-mantle-primary/10 border border-transparent hover:border-mantle-primary/30'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Swap Tab */}
        {activeTab === 'swap' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Swap Interface */}
            <div className="lg:col-span-1">
              <Card variant="glass">
                <h3 className="text-xl font-semibold text-white mb-6">Swap Tokens</h3>
                
                <div className="space-y-4">
                  {/* From Token */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">From</label>
                    <div className="flex space-x-2">
                      <select
                        value={swapForm.tokenIn}
                        onChange={(e) => setSwapForm({ ...swapForm, tokenIn: e.target.value })}
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      >
                        <option value="MRT">MRT</option>
                        <option value="USDC">USDC</option>
                        <option value="MNT">MNT</option>
                      </select>
                      <Input
                        type="number"
                        value={swapForm.amountIn}
                        onChange={(e) => setSwapForm({ ...swapForm, amountIn: e.target.value })}
                        placeholder="0.0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Swap Direction */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setSwapForm({
                        ...swapForm,
                        tokenIn: swapForm.tokenOut,
                        tokenOut: swapForm.tokenIn
                      })}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <ArrowUpDown className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* To Token */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">To</label>
                    <div className="flex space-x-2">
                      <select
                        value={swapForm.tokenOut}
                        onChange={(e) => setSwapForm({ ...swapForm, tokenOut: e.target.value })}
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      >
                        <option value="USDC">USDC</option>
                        <option value="MRT">MRT</option>
                        <option value="MNT">MNT</option>
                      </select>
                      <Input
                        type="text"
                        value={swapQuote?.outputAmount || '0.0'}
                        readOnly
                        placeholder="0.0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Swap Quote */}
                  {swapQuote && (
                    <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Price Impact</span>
                        <span className="text-white">{(swapQuote.priceImpact * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Minimum Received</span>
                        <span className="text-white">{parseFloat(swapQuote.minimumReceived).toFixed(4)} {swapForm.tokenOut}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Gas Estimate</span>
                        <span className="text-white">{swapQuote.gasEstimate.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Slippage Settings */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Slippage Tolerance</label>
                    <div className="flex space-x-2">
                      {[0.1, 0.5, 1.0].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSwapForm({ ...swapForm, slippage: value })}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            swapForm.slippage === value
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {value}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={executeSwap}
                    disabled={actionLoading || !swapForm.amountIn || !swapQuote}
                    leftIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                    className="w-full"
                  >
                    {actionLoading ? 'Swapping...' : 'Swap'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Trading Pairs */}
            <div className="lg:col-span-2">
              <Card variant="glass">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">Trading Pairs</h3>
                  <Button
                    variant="outline"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={loadAllData}
                  >
                    Refresh
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Pair</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Price</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">24h Volume</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">APY</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradingPairs.map((pair) => (
                        <tr key={pair.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-4 px-4">
                            <div className="text-white font-medium">
                              {pair.token0Symbol}/{pair.token1Symbol}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-300">
                            ${pair.price.toFixed(4)}
                          </td>
                          <td className="py-4 px-4 text-gray-300">
                            ${pair.volume24h.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-green-400">
                            {pair.apy.toFixed(1)}%
                          </td>
                          <td className="py-4 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSwapForm({
                                  ...swapForm,
                                  tokenIn: pair.token0Symbol,
                                  tokenOut: pair.token1Symbol
                                });
                              }}
                            >
                              Trade
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Liquidity Tab */}
        {activeTab === 'liquidity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Add Liquidity Interface */}
            <div className="lg:col-span-1">
              <Card variant="glass">
                <h3 className="text-xl font-semibold text-white mb-6">Add Liquidity</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Token A</label>
                    <div className="flex space-x-2">
                      <select
                        value={liquidityForm.token0}
                        onChange={(e) => setLiquidityForm({ ...liquidityForm, token0: e.target.value })}
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      >
                        <option value="MRT">MRT</option>
                        <option value="USDC">USDC</option>
                        <option value="MNT">MNT</option>
                      </select>
                      <Input
                        type="number"
                        value={liquidityForm.amount0}
                        onChange={(e) => setLiquidityForm({ ...liquidityForm, amount0: e.target.value })}
                        placeholder="0.0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Token B</label>
                    <div className="flex space-x-2">
                      <select
                        value={liquidityForm.token1}
                        onChange={(e) => setLiquidityForm({ ...liquidityForm, token1: e.target.value })}
                        className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      >
                        <option value="USDC">USDC</option>
                        <option value="MRT">MRT</option>
                        <option value="MNT">MNT</option>
                      </select>
                      <Input
                        type="number"
                        value={liquidityForm.amount1}
                        onChange={(e) => setLiquidityForm({ ...liquidityForm, amount1: e.target.value })}
                        placeholder="0.0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={addLiquidity}
                    disabled={actionLoading || !liquidityForm.amount0 || !liquidityForm.amount1}
                    leftIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                    className="w-full"
                  >
                    {actionLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Liquidity Pools */}
            <div className="lg:col-span-2">
              <Card variant="glass">
                <h3 className="text-xl font-semibold text-white mb-6">Liquidity Pools</h3>
                
                <div className="space-y-4">
                  {liquidityPools.map((pool) => (
                    <div key={pool.id} className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-white font-semibold">{pool.name}</h4>
                          <p className="text-gray-400 text-sm">Total Liquidity: ${pool.totalLiquidity.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-semibold">{pool.apy.toFixed(1)}% APY</div>
                          <div className="text-gray-400 text-sm">24h Volume: ${pool.volume24h.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {pool.userLiquidity > 0 && (
                        <div className="flex justify-between items-center p-3 bg-primary-500/10 rounded-lg border border-primary-500/20">
                          <div>
                            <div className="text-white font-medium">Your Liquidity</div>
                            <div className="text-gray-400 text-sm">${pool.userLiquidity.toLocaleString()}</div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Remove
                            </Button>
                            <Button variant="primary" size="sm">
                              Add More
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Lending Tab */}
        {activeTab === 'lending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Lending Interface */}
            <div className="lg:col-span-1">
              <Card variant="glass">
                <h3 className="text-xl font-semibold text-white mb-6">Lending & Borrowing</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Action</label>
                    <select
                      value={lendingForm.action}
                      onChange={(e) => setLendingForm({ ...lendingForm, action: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="supply">Supply</option>
                      <option value="borrow">Borrow</option>
                      <option value="repay">Repay</option>
                      <option value="withdraw">Withdraw</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Asset</label>
                    <select
                      value={lendingForm.asset}
                      onChange={(e) => setLendingForm({ ...lendingForm, asset: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="MRT">MRT</option>
                      <option value="USDC">USDC</option>
                      <option value="MNT">MNT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Amount</label>
                    <Input
                      type="number"
                      value={lendingForm.amount}
                      onChange={(e) => setLendingForm({ ...lendingForm, amount: e.target.value })}
                      placeholder="0.0"
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={executeLendingAction}
                    disabled={actionLoading || !lendingForm.amount}
                    leftIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                    className="w-full"
                  >
                    {actionLoading ? `${lendingForm.action}ing...` : lendingForm.action.charAt(0).toUpperCase() + lendingForm.action.slice(1)}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Lending Pools */}
            <div className="lg:col-span-2">
              <Card variant="glass">
                <h3 className="text-xl font-semibold text-white mb-6">Lending Markets</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Asset</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Supply APY</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Borrow APY</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Utilization</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Your Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lendingPools.map((pool) => (
                        <tr key={pool.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-4 px-4">
                            <div className="text-white font-medium">{pool.assetSymbol}</div>
                          </td>
                          <td className="py-4 px-4 text-green-400">
                            {pool.supplyApy.toFixed(2)}%
                          </td>
                          <td className="py-4 px-4 text-red-400">
                            {pool.borrowApy.toFixed(2)}%
                          </td>
                          <td className="py-4 px-4 text-gray-300">
                            {pool.utilizationRate}%
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <div className="text-green-400">Supplied: {pool.userSupply.toLocaleString()}</div>
                              <div className="text-red-400">Borrowed: {pool.userBorrow.toLocaleString()}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Yield Farming Tab */}
        {activeTab === 'yield' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Stake Interface */}
            <div className="lg:col-span-1">
              <Card variant="glass">
                <h3 className="text-xl font-semibold text-white mb-6">Stake LP Tokens</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Farm</label>
                    <select
                      value={yieldForm.farmId}
                      onChange={(e) => setYieldForm({ ...yieldForm, farmId: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">Select a farm</option>
                      {yieldFarms.map((farm) => (
                        <option key={farm.id} value={farm.id}>
                          {farm.name} - {farm.apy.toFixed(1)}% APY
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Amount</label>
                    <Input
                      type="number"
                      value={yieldForm.amount}
                      onChange={(e) => setYieldForm({ ...yieldForm, amount: e.target.value })}
                      placeholder="0.0"
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={stakeInFarm}
                    disabled={actionLoading || !yieldForm.farmId || !yieldForm.amount}
                    leftIcon={actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                    className="w-full"
                  >
                    {actionLoading ? 'Staking...' : 'Stake LP Tokens'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Yield Farms */}
            <div className="lg:col-span-2">
              <Card variant="glass">
                <h3 className="text-xl font-semibold text-white mb-6">Yield Farms</h3>
                
                <div className="space-y-4">
                  {yieldFarms.map((farm) => (
                    <div key={farm.id} className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-white font-semibold">{farm.name}</h4>
                          <p className="text-gray-400 text-sm">
                            Reward: {farm.rewardTokenSymbol} | 
                            Total Staked: ${farm.totalStaked.toLocaleString()}
                          </p>
                          {farm.lockPeriod > 0 && (
                            <p className="text-yellow-400 text-sm">Lock Period: {farm.lockPeriod} days</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-semibold text-xl">{farm.apy.toFixed(1)}%</div>
                          <div className="text-gray-400 text-sm">APY</div>
                        </div>
                      </div>
                      
                      {farm.userStaked > 0 && (
                        <div className="flex justify-between items-center p-3 bg-primary-500/10 rounded-lg border border-primary-500/20">
                          <div>
                            <div className="text-white font-medium">Your Stake: ${farm.userStaked.toLocaleString()}</div>
                            <div className="text-green-400 text-sm">Pending Rewards: {farm.pendingRewards.toFixed(2)} {farm.rewardTokenSymbol}</div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => claimRewards(farm.id)}
                              disabled={actionLoading || farm.pendingRewards === 0}
                            >
                              Claim
                            </Button>
                            <Button variant="primary" size="sm">
                              Stake More
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DeFiPage;