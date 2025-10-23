'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Music, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  mrtTokens?: number;
  revenue?: number;
}

const ArtistPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'tracks' | 'analytics'>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const mockTracks: Track[] = [
    {
      id: '1',
      title: 'Brightest Star in the Night Sky',
      artist: 'Escape Plan',
      duration: '4:32',
      uploadDate: '2024-01-15',
      status: 'approved',
      mrtTokens: 10000,
      revenue: 2500
    },
    {
      id: '2',
      title: 'Youth',
      artist: 'Mao Buyi',
      duration: '3:45',
      uploadDate: '2024-01-10',
      status: 'pending',
    },
    {
      id: '3',
      title: 'People Like Me',
      artist: 'Mao Buyi',
      duration: '4:18',
      uploadDate: '2024-01-08',
      status: 'approved',
      mrtTokens: 8500,
      revenue: 1800
    }
  ];

  const stats = [
    { label: 'Total Tracks', value: '12', icon: Music, color: 'from-mantle-primary to-mantle-secondary' },
    { label: 'MRT Tokens', value: '45.2K', icon: DollarSign, color: 'from-mantle-secondary to-mantle-primary' },
    { label: 'Mantle Revenue', value: '$8,750', icon: TrendingUp, color: 'from-mantle-accent to-mantle-primary' },
    { label: 'Monthly Listeners', value: '2.8K', icon: Eye, color: 'from-mantle-primary to-mantle-accent' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'upload', label: 'Upload Track', icon: Upload },
    { id: 'tracks', label: 'Track Management', icon: Music },
    { id: 'analytics', label: 'Analytics', icon: FileText },
  ];

  const getStatusColor = (status: Track['status']) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (status: Track['status']) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-mantle-primary to-mantle-secondary rounded-xl flex items-center justify-center neon-mantle">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold gradient-text-mantle mb-1">
                MantleMusicFi Artist Portal
              </h1>
              <div className="flex items-center gap-2 text-sm text-mantle-primary">
                <span className="w-2 h-2 bg-mantle-primary rounded-full animate-pulse"></span>
                <span>Publish and manage your music on Mantle Network</span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-lg">
            Manage your music works, apply for MRT token issuance, track revenue performance on Mantle Chain
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="glass">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-gray-400 text-sm">{stat.label}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity */}
            <Card variant="glass">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Activities</h3>
              <div className="space-y-4">
                {mockTracks.slice(0, 3).map((track) => (
                  <div key={track.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{track.title}</div>
                        <div className="text-gray-400 text-sm">{track.uploadDate}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(track.status)}`}>
                      {getStatusText(track.status)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <Card variant="glass">
              <h3 className="text-xl font-semibold text-white mb-6">Upload New Track</h3>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-6 hover:border-primary-500 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Drag audio files here, or click to select files</p>
                <p className="text-gray-500 text-sm">Supports MP3, WAV, FLAC formats, max 100MB</p>
                <Button variant="outline" className="mt-4">
                  Select Files
                </Button>
              </div>

              {/* Metadata Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Track Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Enter track title"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Artist Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Enter artist name"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Album Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Enter album name"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Release Year</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="2024"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-white text-sm font-medium mb-2">Track Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Describe your track..."
                  />
                </div>
              </div>

              {/* MRT Settings */}
              <div className="mt-8 p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-lg border border-primary-500/20">
                <h4 className="text-lg font-semibold text-white mb-4">MRT Tokenization Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Expected Revenue Period (Years)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Expected Annual Revenue (USD)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                      placeholder="10000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <Button variant="outline">
                  Save Draft
                </Button>
                <Button variant="primary">
                  Submit for Review
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tracks Management Tab */}
        {activeTab === 'tracks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Track Management</h3>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setActiveTab('upload')}
              >
                Upload New Track
              </Button>
            </div>

            <Card variant="glass">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Track</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Duration</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">MRT Tokens</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Revenue</th>
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTracks.map((track) => (
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
                        <td className="py-4 px-4 text-gray-300">{track.duration}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(track.status)}`}>
                            {getStatusText(track.status)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-300">
                          {track.mrtTokens ? track.mrtTokens.toLocaleString() : '-'}
                        </td>
                        <td className="py-4 px-4 text-gray-300">
                          {track.revenue ? `$${track.revenue.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-white">Analytics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="glass">
                <h4 className="text-lg font-semibold text-white mb-4">Revenue Trends</h4>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Revenue chart will be displayed here</p>
                  </div>
                </div>
              </Card>

              <Card variant="glass">
                <h4 className="text-lg font-semibold text-white mb-4">Audience Analytics</h4>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Audience data chart will be displayed here</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card variant="glass">
              <h4 className="text-lg font-semibold text-white mb-4">Track Performance Ranking</h4>
              <div className="space-y-4">
                {mockTracks.filter(track => track.revenue).map((track, index) => (
                  <div key={track.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{track.title}</div>
                        <div className="text-gray-400 text-sm">{track.mrtTokens?.toLocaleString()} MRT</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">${track.revenue?.toLocaleString()}</div>
                      <div className="text-green-400 text-sm">+12.5%</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ArtistPortal;