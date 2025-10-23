'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { artistService, Track as ServiceTrack, ArtistStats, UploadTrackData } from '@/services/artistService';

interface LocalTrack {
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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [stats, setStats] = useState<ArtistStats | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // 上传表单状态
  const [uploadForm, setUploadForm] = useState<UploadTrackData>({
    title: '',
    artist: '',
    album: '',
    releaseYear: new Date().getFullYear(),
    genre: 'Pop',
    duration: 0,
    description: '',
    lyrics: '',
    collaborators: [],
    tags: []
  });
  
  const [selectedFiles, setSelectedFiles] = useState<{
    audio: File | null;
    cover: File | null;
  }>({
    audio: null,
    cover: null
  });
  
  const audioFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  // 加载数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await artistService.getDashboard();
      setStats(dashboardData.stats);
      setTracks(dashboardData.recentTracks);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showNotification('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadTracks = async () => {
    try {
      const tracksData = await artistService.getTracks();
      setTracks(tracksData.tracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      showNotification('error', 'Failed to load tracks');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileSelect = (type: 'audio' | 'cover', file: File) => {
    setSelectedFiles(prev => ({ ...prev, [type]: file }));
    
    if (type === 'audio') {
      // 获取音频文件的时长
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        setUploadForm(prev => ({ ...prev, duration: Math.round(audio.duration) }));
        URL.revokeObjectURL(audio.src);
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.audio || !uploadForm.title || !uploadForm.artist) {
      showNotification('error', 'Please fill in required fields and select an audio file');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('audio', selectedFiles.audio);
      if (selectedFiles.cover) {
        formData.append('cover', selectedFiles.cover);
      }
      
      // 添加元数据
      Object.entries(uploadForm).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await artistService.uploadTrack(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        showNotification('success', 'Track uploaded successfully!');
        setIsUploadModalOpen(false);
        resetUploadForm();
        loadTracks(); // 重新加载曲目列表
        loadDashboardData(); // 重新加载仪表板数据
      } else {
        showNotification('error', result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      artist: '',
      album: '',
      releaseYear: new Date().getFullYear(),
      genre: 'Pop',
      duration: 0,
      description: '',
      lyrics: '',
      collaborators: [],
      tags: []
    });
    setSelectedFiles({ audio: null, cover: null });
    if (audioFileRef.current) audioFileRef.current.value = '';
    if (coverFileRef.current) coverFileRef.current.value = '';
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const statsData = stats ? [
    { label: 'Total Tracks', value: stats.totalTracks.toString(), icon: Music, color: 'from-mantle-primary to-mantle-secondary' },
    { label: 'MRT Tokens', value: `${(stats.totalTokens / 1000).toFixed(1)}K`, icon: DollarSign, color: 'from-mantle-secondary to-mantle-primary' },
    { label: 'Mantle Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'from-mantle-accent to-mantle-primary' },
    { label: 'Monthly Listeners', value: `${(stats.monthlyListeners / 1000).toFixed(1)}K`, icon: Eye, color: 'from-mantle-primary to-mantle-accent' },
  ] : [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'upload', label: 'Upload Track', icon: Upload },
    { id: 'tracks', label: 'Track Management', icon: Music },
    { id: 'analytics', label: 'Analytics', icon: FileText },
  ];

  const getStatusColor = (status: LocalTrack['status']) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (status: LocalTrack['status']) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-mantle-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading artist portal...</p>
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
            {/* 音乐主题的独特logo设计 */}
            <div className="relative">
              {/* 主要logo容器 - 圆形设计 */}
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center shadow-2xl">
                <Music className="w-8 h-8 text-white" />
              </div>
              {/* 音符装饰 */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-xs font-bold">♪</span>
              </div>
              {/* 波纹效果 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-400/30 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-1">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  Artist Portal
                </span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-purple-400">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
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
              {statsData.map((stat, index) => (
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
                {tracks.slice(0, 3).map((track) => (
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
                <p className="text-gray-400 mb-2">Select audio and cover files</p>
                <p className="text-gray-500 text-sm">Supports MP3, WAV, FLAC formats, max 100MB</p>
                
                <div className="flex gap-4 justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => audioFileRef.current?.click()}
                    disabled={uploading}
                  >
                    {selectedFiles.audio ? 'Audio Selected' : 'Select Audio'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => coverFileRef.current?.click()}
                    disabled={uploading}
                  >
                    {selectedFiles.cover ? 'Cover Selected' : 'Select Cover'}
                  </Button>
                </div>
                
                <input
                  ref={audioFileRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect('audio', file);
                  }}
                />
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect('cover', file);
                  }}
                />
                
                {selectedFiles.audio && (
                  <div className="mt-4 text-sm text-green-400">
                    Audio: {selectedFiles.audio.name}
                  </div>
                )}
                {selectedFiles.cover && (
                  <div className="mt-2 text-sm text-green-400">
                    Cover: {selectedFiles.cover.name}
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">Uploading...</span>
                    <span className="text-white text-sm">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-mantle-primary to-mantle-secondary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Metadata Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Track Title *</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Enter track title"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Artist Name *</label>
                  <input
                    type="text"
                    value={uploadForm.artist}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Enter artist name"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Album Name</label>
                  <input
                    type="text"
                    value={uploadForm.album}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, album: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Enter album name"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Genre</label>
                  <select
                    value={uploadForm.genre}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    disabled={uploading}
                  >
                    <option value="Pop">Pop</option>
                    <option value="Rock">Rock</option>
                    <option value="Hip-Hop">Hip-Hop</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Classical">Classical</option>
                    <option value="Jazz">Jazz</option>
                    <option value="Blues">Blues</option>
                    <option value="Country">Country</option>
                    <option value="Folk">Folk</option>
                    <option value="R&B">R&B</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-white text-sm font-medium mb-2">Track Description</label>
                  <textarea
                    rows={4}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                    placeholder="Describe your track..."
                    disabled={uploading}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <Button 
                  variant="outline"
                  onClick={resetUploadForm}
                  disabled={uploading}
                >
                  Reset
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFiles.audio || !uploadForm.title || !uploadForm.artist}
                  leftIcon={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {uploading ? 'Uploading...' : 'Upload Track'}
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
                    {tracks.map((track) => (
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
                {tracks.filter(track => track.revenue).map((track, index) => (
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