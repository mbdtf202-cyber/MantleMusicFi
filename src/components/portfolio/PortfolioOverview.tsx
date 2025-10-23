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
  RefreshCw,
  Eye,
  EyeOff,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LineChart from '@/components/charts/LineChart';
import { default as CustomPieChart } from '@/components/charts/PieChart';

interface Asset {
  tokenId: string;
  symbol: string;
  name: string;
  balance: string;
  value: string;
  invested: string;
  returns: string;
  returnPercentage: number;
  price: string;
  priceChange24h: number;
  allocation: number;
}

interface Portfolio {
  userId: string;
  totalValue: string;
  totalInvested: string;
  totalReturns: string;
  returnPercentage: number;
  assets: Asset[];
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  lastUpdated: number;
}

interface Analytics {
  diversificationScore: number;
  riskScore: number;
  sharpeRatio: number;
  volatility: number;
  beta: number;
}

interface PortfolioData {
  portfolio: Portfolio;
  analytics: Analytics;
}

const PortfolioOverview: React.FC<{ userId: string }> = ({ userId }) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'1d' | '7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchPortfolioData();
    fetchPerformanceHistory();
  }, [userId, selectedPeriod]);

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch(`/api/analytics/portfolio/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPortfolioData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceHistory = async () => {
    try {
      const response = await fetch(`/api/analytics/portfolio/${userId}/performance?period=${selectedPeriod}&interval=1d`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPerformanceHistory(data.data.performance.map((item: any) => ({
          x: new Date(item.timestamp).toLocaleDateString(),
          y: parseFloat(item.returns)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch performance history:', error);
    }
  };

  const formatCurrency = (value: string, decimals: number = 4) => {
    if (hideBalances) return '****';
    const num = parseFloat(value);
    return `${num.toFixed(decimals)} ETH`;
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

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'text-green-400' };
    if (score < 70) return { level: 'Medium', color: 'text-yellow-400' };
    return { level: 'High', color: 'text-red-400' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <Card variant="glass" className="p-8 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">No Portfolio Data</h3>
        <p className="text-gray-400">Start investing to see your portfolio here.</p>
      </Card>
    );
  }

  const { portfolio, analytics } = portfolioData;
  const riskLevel = getRiskLevel(analytics.riskScore);

  // Prepare pie chart data for asset allocation
  const allocationData = portfolio.assets.map((asset, index) => ({
    label: asset.symbol,
    value: asset.allocation,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
  }));

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Portfolio Overview</h2>
          <p className="text-gray-400">Track your music asset investments</p>
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
            onClick={fetchPortfolioData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-primary-500/20">
              <DollarSign className="w-6 h-6 text-primary-400" />
            </div>
            {formatPercentage(portfolio.performance.daily)}
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Total Value</h3>
          <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.totalValue)}</p>
        </Card>

        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            {formatPercentage(portfolio.returnPercentage)}
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Total Returns</h3>
          <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.totalReturns)}</p>
        </Card>

        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400">{analytics.diversificationScore.toFixed(1)}/100</span>
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Diversification</h3>
          <p className="text-2xl font-bold text-white">
            {analytics.diversificationScore > 70 ? 'Excellent' : 
             analytics.diversificationScore > 50 ? 'Good' : 'Needs Work'}
          </p>
        </Card>

        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <Shield className="w-6 h-6 text-yellow-400" />
            </div>
            <span className={`text-sm ${riskLevel.color}`}>{riskLevel.level}</span>
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Risk Score</h3>
          <p className="text-2xl font-bold text-white">{analytics.riskScore.toFixed(1)}/100</p>
        </Card>
      </div>

      {/* Performance Chart and Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Performance History</h3>
            <div className="flex space-x-2">
              {(['1d', '7d', '30d', '90d', '1y'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    selectedPeriod === period
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <LineChart
              data={performanceHistory}
              color="#00D4AA"
              showGrid={true}
            />
          </div>
        </Card>

        <Card variant="glass" className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Asset Allocation</h3>
          <div className="h-64">
            <CustomPieChart
              data={allocationData}
              showLegend={true}
            />
          </div>
        </Card>
      </div>

      {/* Asset Holdings */}
      <Card variant="glass" className="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Asset Holdings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Balance</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Value</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">24h Change</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Returns</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.assets.map((asset) => (
                <motion.tr
                  key={asset.tokenId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-semibold text-white">{asset.symbol}</div>
                      <div className="text-sm text-gray-400">{asset.name}</div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4 text-white">
                    {hideBalances ? '****' : parseFloat(asset.balance).toLocaleString()}
                  </td>
                  <td className="text-right py-4 px-4 text-white">
                    {formatCurrency(asset.value)}
                  </td>
                  <td className="text-right py-4 px-4">
                    {formatPercentage(asset.priceChange24h)}
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="text-white">{formatCurrency(asset.returns)}</div>
                    <div className="text-sm">{formatPercentage(asset.returnPercentage)}</div>
                  </td>
                  <td className="text-right py-4 px-4 text-white">
                    {asset.allocation.toFixed(1)}%
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Analytics Summary */}
      <Card variant="glass" className="p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Portfolio Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">{analytics.sharpeRatio.toFixed(2)}</div>
            <div className="text-gray-400">Sharpe Ratio</div>
            <div className="text-sm text-gray-500 mt-1">Risk-adjusted returns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">{analytics.volatility.toFixed(1)}%</div>
            <div className="text-gray-400">Volatility</div>
            <div className="text-sm text-gray-500 mt-1">Price fluctuation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">{analytics.beta.toFixed(2)}</div>
            <div className="text-gray-400">Beta</div>
            <div className="text-sm text-gray-500 mt-1">Market correlation</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PortfolioOverview;