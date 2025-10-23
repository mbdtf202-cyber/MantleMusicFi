'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import { TrendingUp, Users, Music, DollarSign, Activity, Target } from 'lucide-react';

const AnalyticsPage = () => {
  // Mock data for charts
  const revenueData = [
    { x: 'Jan', y: 12000 },
    { x: 'Feb', y: 19000 },
    { x: 'Mar', y: 15000 },
    { x: 'Apr', y: 25000 },
    { x: 'May', y: 22000 },
    { x: 'Jun', y: 30000 },
    { x: 'Jul', y: 28000 },
  ];

  const userGrowthData = [
    { x: 'Jan', y: 1200 },
    { x: 'Feb', y: 1900 },
    { x: 'Mar', y: 3000 },
    { x: 'Apr', y: 5000 },
    { x: 'May', y: 7200 },
    { x: 'Jun', y: 9800 },
    { x: 'Jul', y: 12500 },
  ];

  const topArtistsData = [
    { label: 'Artist A', value: 45, color: '#3B82F6' },
    { label: 'Artist B', value: 32, color: '#8B5CF6' },
    { label: 'Artist C', value: 28, color: '#F59E0B' },
    { label: 'Artist D', value: 25, color: '#EF4444' },
    { label: 'Artist E', value: 20, color: '#10B981' },
  ];

  const genreDistribution = [
    { label: 'Electronic', value: 35, color: '#3B82F6' },
    { label: 'Pop', value: 28, color: '#8B5CF6' },
    { label: 'Rock', value: 20, color: '#F59E0B' },
    { label: 'Classical', value: 12, color: '#EF4444' },
    { label: 'Others', value: 5, color: '#10B981' },
  ];

  const platformMetrics = [
    { label: 'Total Users', value: 12500, icon: Users, color: '#3B82F6' },
    { label: 'Active Artists', value: 850, icon: Music, color: '#8B5CF6' },
    { label: 'Total Revenue (ETH)', value: 2847, icon: DollarSign, color: '#F59E0B' },
    { label: 'Trading Volume', value: 15420, icon: Activity, color: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="cyber-grid opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Analytics Center
          </h1>
          <p className="text-gray-300">
            Real-time platform data monitoring and market trend insights
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {platformMetrics.map((metric, index) => (
            <Card key={index} variant="glass" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold text-white">
                    {metric.value.toLocaleString()}
                  </p>
                </div>
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${metric.color}20` }}
                >
                  <metric.icon 
                    className="w-6 h-6" 
                    style={{ color: metric.color }}
                  />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400">+12.5%</span>
                <span className="text-gray-400 ml-1">vs last month</span>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Revenue Trends</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <Target className="w-4 h-4 mr-1" />
                  Past 7 months
                </div>
              </div>
              <LineChart
                data={revenueData}
                width={500}
                height={300}
                color="#3B82F6"
                gradient={true}
                showGrid={true}
                showDots={true}
                animate={true}
              />
            </Card>
          </motion.div>

          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">User Growth</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  Cumulative Users
                </div>
              </div>
              <LineChart
                data={userGrowthData}
                width={500}
                height={300}
                color="#8B5CF6"
                gradient={true}
                showGrid={true}
                showDots={true}
                animate={true}
              />
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Artists */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Top Artists</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <Music className="w-4 h-4 mr-1" />
                  Monthly Revenue Ranking
                </div>
              </div>
              <BarChart
                data={topArtistsData}
                width={500}
                height={300}
                showValues={true}
                animate={true}
                horizontal={true}
              />
            </Card>
          </motion.div>

          {/* Genre Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Music Genre Distribution</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <Activity className="w-4 h-4 mr-1" />
                  Play Count Distribution
                </div>
              </div>
              <div className="flex justify-center">
                <PieChart
                  data={genreDistribution}
                  size={300}
                  showLabels={true}
                  showLegend={true}
                  animate={true}
                  donut={true}
                  donutWidth={60}
                />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Additional Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <Card variant="glass" className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Market Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">85%</div>
                <div className="text-gray-300 text-sm">User Retention Rate</div>
                <div className="text-xs text-gray-500 mt-1">Up 5% from last month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">2.4x</div>
                <div className="text-gray-300 text-sm">Average ROI</div>
                <div className="text-xs text-gray-500 mt-1">Industry leading level</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">156</div>
                <div className="text-gray-300 text-sm">New MRT Tokens</div>
                <div className="text-xs text-gray-500 mt-1">Monthly issuance</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage;