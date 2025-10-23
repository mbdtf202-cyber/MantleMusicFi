'use client';

import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Users,
  Target,
  Activity,
  Shield,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import PortfolioOverview from '@/components/portfolio/PortfolioOverview';
import AdvancedChart from '@/components/charts/AdvancedChart';
import DashboardService, { 
  Investment as ApiInvestment, 
  MarketSong as ApiMarketSong, 
  DeFiMetrics as ApiDeFiMetrics,
  PortfolioStats,
  MarketFilter
} from '@/services/dashboardService';

// 本地接口定义（兼容现有代码）
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
  status: string;
}

interface MarketSong {
  id: string;
  title: string;
  artist: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  genre: string;
  trending?: boolean;
}

interface DeFiMetrics {
  totalValueLocked: number;
  stakingRewards: number;
  liquidityPools: number;
  governanceTokens: number;
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
  // 默认用户ID，实际应用中应从认证系统获取
  const userId = 'user123';
  
  const [activeTab, setActiveTab] = useState<'portfolio' | 'market' | 'analytics' | 'defi'>('portfolio');
  const [searchTerm, setSearchTerm] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [marketSongs, setMarketSongs] = useState<MarketSong[]>([]);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [defiMetrics, setDefiMetrics] = useState<DeFiMetrics | null>(null);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 并行获取所有数据
      const [dashboardData, portfolioHistory] = await Promise.all([
        DashboardService.getDashboardData(userId),
        DashboardService.getPortfolioHistory(userId)
      ]);

      // 更新状态
      setInvestments(dashboardData.investments);
      setMarketSongs(dashboardData.marketSongs);
      setPortfolioStats(dashboardData.portfolioStats);
      setDefiMetrics(dashboardData.defiMetrics);
      setPortfolioData(portfolioHistory);

      setNotification({
        type: 'success',
        message: 'Dashboard data updated successfully'
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load dashboard data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 投资音乐资产
  const handleInvestInTrack = async (trackId: string, amount: number) => {
    try {
      setOperationLoading(true);
      const result = await DashboardService.investInTrack(trackId, amount);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: `Successfully invested ${amount} ETH in track`
        });
        // 重新加载数据
        await fetchDashboardData();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Investment failed'
        });
      }
    } catch (error) {
      console.error('Investment error:', error);
      setNotification({
        type: 'error',
        message: 'Investment failed. Please try again.'
      });
    } finally {
      setOperationLoading(false);
    }
  };

  // 出售投资
  const handleSellInvestment = async (investmentId: string, amount: number) => {
    try {
      setOperationLoading(true);
      const result = await DashboardService.sellInvestment(investmentId, amount);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: `Successfully sold ${amount} ETH worth of investment`
        });
        // 重新加载数据
        await fetchDashboardData();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Sale failed'
        });
      }
    } catch (error) {
      console.error('Sale error:', error);
      setNotification({
        type: 'error',
        message: 'Sale failed. Please try again.'
      });
    } finally {
      setOperationLoading(false);
    }
  };

  // 清除通知
  const clearNotification = () => {
    setNotification(null);
  };

  // 自动清除通知
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(clearNotification, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const getPortfolioStatsDisplay = () => {
    if (!portfolioStats) {
      return [
        { 
          label: 'Total Investment Value', 
          value: '0.00 ETH', 
          change: '+0.00 ETH', 
          changePercent: '+0.0%',
          icon: DollarSign, 
          color: 'from-green-500 to-green-600',
          isPositive: true
        },
        { 
          label: 'Daily Return', 
          value: '+0.00 ETH', 
          change: '+0.0%', 
          changePercent: '',
          icon: TrendingUp, 
          color: 'from-blue-500 to-blue-600',
          isPositive: true
        },
        { 
          label: 'MRT Holdings', 
          value: '0', 
          change: '+0', 
          changePercent: '+0.0%',
          icon: PieChart, 
          color: 'from-purple-500 to-purple-600',
          isPositive: true
        },
        { 
          label: 'Portfolio Count', 
          value: '0', 
          change: '+0', 
          changePercent: '',
          icon: BarChart3, 
          color: 'from-orange-500 to-orange-600',
          isPositive: true
        },
      ];
    }

    const dailyReturnIsPositive = portfolioStats.dailyReturn >= 0;
    const totalReturnIsPositive = portfolioStats.totalReturn >= 0;

    return [
      { 
        label: 'Total Investment Value', 
        value: formatCurrency(portfolioStats.currentValue), 
        change: `${totalReturnIsPositive ? '+' : ''}${formatCurrency(portfolioStats.totalReturn)}`, 
        changePercent: `${totalReturnIsPositive ? '+' : ''}${portfolioStats.returnPercentage.toFixed(1)}%`,
        icon: DollarSign, 
        color: 'from-green-500 to-green-600',
        isPositive: totalReturnIsPositive
      },
      { 
        label: 'Daily Return', 
        value: `${dailyReturnIsPositive ? '+' : ''}${formatCurrency(portfolioStats.dailyReturn)}`, 
        change: `${dailyReturnIsPositive ? '+' : ''}${(portfolioStats.dailyReturn / portfolioStats.currentValue * 100).toFixed(2)}%`, 
        changePercent: '',
        icon: dailyReturnIsPositive ? TrendingUp : TrendingDown, 
        color: dailyReturnIsPositive ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600',
        isPositive: dailyReturnIsPositive
      },
      { 
        label: 'MRT Holdings', 
        value: portfolioStats.mrtHoldings.toLocaleString(), 
        change: '+0', 
        changePercent: '',
        icon: PieChart, 
        color: 'from-purple-500 to-purple-600',
        isPositive: true
      },
      { 
        label: 'Portfolio Count', 
        value: portfolioStats.portfolioCount.toString(), 
        change: '', 
        changePercent: '',
        icon: BarChart3, 
        color: 'from-orange-500 to-orange-600',
        isPositive: true
      },
    ];
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturns = totalValue - totalInvested;
  const totalReturnPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  const formatCurrency = (value: number, decimals: number = 4) => {
    if (hideBalances) return '****';
    return `${value.toFixed(decimals)} ETH`;
  };

  const formatPercentage = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {Math.abs(value).toFixed(2)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  const tabs = [
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'defi', label: 'DeFi', icon: Zap },
  ];

  const totalInvestment = mockInvestments.reduce((sum, inv) => sum + inv.investmentAmount, 0);
  const totalCurrentValue = mockInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturn = totalCurrentValue - totalInvestment;

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
                Track your music asset investments and market opportunities
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideBalances(!hideBalances)}
                leftIcon={hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              >
                {hideBalances ? 'Show' : 'Hide'} Balances
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </div>
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
            {getPortfolioStatsDisplay().map((stat, index) => (
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
          <PortfolioOverview userId={userId} />

        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            {/* Market Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm text-green-400">+5.2%</span>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Market Cap</h3>
                <p className="text-2xl font-bold text-white">1,234.5 ETH</p>
              </Card>

              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-sm text-green-400">+12.8%</span>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">24h Volume</h3>
                <p className="text-2xl font-bold text-white">89.3 ETH</p>
              </Card>

              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Music className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-400">Active</span>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Listed Songs</h3>
                <p className="text-2xl font-bold text-white">1,567</p>
              </Card>

              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-yellow-500/20">
                    <Users className="w-6 h-6 text-yellow-400" />
                  </div>
                  <span className="text-sm text-green-400">+234</span>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Active Traders</h3>
                <p className="text-2xl font-bold text-white">8,923</p>
              </Card>
            </div>

            {/* Trending Songs */}
            <Card variant="glass">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Trending Songs</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    All Genres
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Song</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Price</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">24h Change</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Volume</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Market Cap</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketSongs.map((song) => (
                      <motion.tr
                        key={song.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {song.trending && (
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                            <div>
                              <div className="font-semibold text-white">{song.title}</div>
                              <div className="text-sm text-gray-400">{song.artist}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-4 px-4 text-white">
                          {formatCurrency(song.price)}
                        </td>
                        <td className="text-right py-4 px-4">
                          {formatPercentage(song.change24h)}
                        </td>
                        <td className="text-right py-4 px-4 text-white">
                          {formatCurrency(song.volume)}
                        </td>
                        <td className="text-right py-4 px-4 text-white">
                          {formatCurrency(song.marketCap)}
                        </td>
                        <td className="text-right py-4 px-4">
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => handleInvestInTrack(song.id, 0.1)}
                            disabled={operationLoading}
                          >
                            {operationLoading ? 'Investing...' : 'Invest'}
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Market Performance Chart */}
            <Card variant="glass" className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Market Performance</h3>
              <div className="h-80">
                <AdvancedChart
                  data={portfolioData}
                  type="area"
                  color="#00D4AA"
                  gradient={true}
                  showGrid={true}
                  showTooltip={true}
                  interactive={true}
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Genre Distribution</h3>
                <div className="space-y-4">
                  {[
                    { genre: 'Electronic', percentage: 35, color: 'bg-blue-500' },
                    { genre: 'Hip Hop', percentage: 25, color: 'bg-purple-500' },
                    { genre: 'Ambient', percentage: 20, color: 'bg-green-500' },
                    { genre: 'Synthwave', percentage: 15, color: 'bg-pink-500' },
                    { genre: 'Jazz', percentage: 5, color: 'bg-yellow-500' }
                  ].map(({ genre, percentage, color }) => (
                    <div key={genre} className="flex items-center justify-between">
                      <span className="text-gray-300">{genre}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div
                            className={`${color} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-white text-sm w-10 text-right">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card variant="glass" className="p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Risk Analysis</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Portfolio Risk</span>
                    <span className="text-green-400 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Low
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Diversification</span>
                    <span className="text-blue-400">Good</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Volatility</span>
                    <span className="text-yellow-400">Medium</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Sharpe Ratio</span>
                    <span className="text-green-400">1.24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Beta</span>
                    <span className="text-blue-400">0.85</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Max Drawdown</span>
                    <span className="text-red-400">-8.5%</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* DeFi Tab */}
        {activeTab === 'defi' && defiMetrics && (
          <div className="space-y-6">
            {/* DeFi Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary-500/20">
                    <DollarSign className="w-6 h-6 text-primary-400" />
                  </div>
                  <span className="text-sm text-green-400">+8.2%</span>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Total Value Locked</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(defiMetrics.totalValueLocked)}</p>
              </Card>

              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-sm text-green-400">APY 12.5%</span>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Staking Rewards</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(defiMetrics.stakingRewards)}</p>
              </Card>

              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm text-blue-400">5 Pools</span>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Liquidity Provided</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(defiMetrics.liquidityPools)}</p>
              </Card>

              <Card variant="glass" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <Target className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-sm text-purple-400">Voting Power</span>
                </div>
                <h3 className="text-sm text-gray-400 mb-1">Governance Tokens</h3>
                <p className="text-2xl font-bold text-white">{defiMetrics.governanceTokens.toLocaleString()}</p>
              </Card>
            </div>

            {/* DeFi Opportunities */}
            <Card variant="glass" className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">DeFi Opportunities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Music LP Staking',
                    apy: '15.2%',
                    tvl: '234.5 ETH',
                    risk: 'Low',
                    description: 'Stake LP tokens from music asset pairs'
                  },
                  {
                    title: 'Royalty Yield Farming',
                    apy: '22.8%',
                    tvl: '156.7 ETH',
                    risk: 'Medium',
                    description: 'Farm yields from royalty distributions'
                  },
                  {
                    title: 'Governance Staking',
                    apy: '8.5%',
                    tvl: '89.3 ETH',
                    risk: 'Low',
                    description: 'Stake governance tokens for voting rewards'
                  }
                ].map((opportunity, index) => (
                  <Card key={index} variant="glass" className="p-4">
                    <h4 className="font-semibold text-white mb-2">{opportunity.title}</h4>
                    <p className="text-sm text-gray-400 mb-4">{opportunity.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">APY</span>
                        <span className="text-green-400 font-semibold">{opportunity.apy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">TVL</span>
                        <span className="text-white">{opportunity.tvl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk</span>
                        <span className={`${
                          opportunity.risk === 'Low' ? 'text-green-400' : 
                          opportunity.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {opportunity.risk}
                        </span>
                      </div>
                    </div>
                    <Button variant="primary" size="sm" className="w-full mt-4">
                      Stake Now
                    </Button>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className={`p-4 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success' 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{notification.message}</span>
                <button
                  onClick={clearNotification}
                  className="ml-3 text-white hover:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InvestorDashboard;