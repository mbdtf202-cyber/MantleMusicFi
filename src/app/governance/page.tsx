'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { 
  Vote, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  Coins,
  TrendingUp,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import GovernanceService, { 
  Proposal as ApiProposal, 
  GovernanceStats as ApiGovernanceStats, 
  UserVotingData as ApiUserVotingData,
  CreateProposalData,
  VoteData
} from '@/services/governanceService';

// 本地接口定义（兼容现有代码）
interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending' | 'executed' | 'cancelled';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  endTime: string;
  category: string;
  type?: string;
  createdAt?: string;
  executedAt?: string;
}

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVotes: number;
  userVotingPower: number;
}

interface UserVotingData {
  votingPower: number;
  delegatedTo: string | null;
  delegatedFrom: string[];
  votingHistory: any[];
}

const GovernancePage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [activeTab, setActiveTab] = useState<'proposals' | 'voting' | 'tokens'>('proposals');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [governanceStats, setGovernanceStats] = useState<GovernanceStats | null>(null);
  const [userVotingData, setUserVotingData] = useState<UserVotingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [createProposalData, setCreateProposalData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'general'
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 显示通知
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // 转换API数据格式
  const convertApiProposal = (apiProposal: ApiProposal): Proposal => ({
    id: parseInt(apiProposal.id),
    title: apiProposal.title,
    description: apiProposal.description,
    proposer: apiProposal.proposer,
    status: apiProposal.status === 'failed' ? 'rejected' : apiProposal.status,
    votesFor: apiProposal.votesFor,
    votesAgainst: apiProposal.votesAgainst,
    totalVotes: apiProposal.totalVotes,
    endTime: new Date(apiProposal.endTime).toLocaleDateString(),
    category: apiProposal.category,
    createdAt: apiProposal.startTime,
    executedAt: apiProposal.executionTime
  });

  // API调用函数
  const loadGovernanceData = async () => {
    setLoading(true);
    try {
      const [apiProposals, apiStats, apiUserData] = await Promise.all([
        GovernanceService.getProposals(),
        GovernanceService.getGovernanceStats(),
        GovernanceService.getUserVotingData()
      ]);
      
      // 转换数据格式
      const convertedProposals = apiProposals.map(convertApiProposal);
      setProposals(convertedProposals);
      
      // 转换统计数据格式
      setGovernanceStats({
        totalProposals: apiStats.totalProposals,
        activeProposals: apiStats.activeProposals,
        totalVotes: parseInt(apiStats.totalVotingPower),
        userVotingPower: parseInt(apiUserData.votingPower)
      });
      
      // 转换用户数据格式
      setUserVotingData({
        votingPower: parseInt(apiUserData.votingPower),
        delegatedTo: apiUserData.delegatedTo || null,
        delegatedFrom: apiUserData.delegatedFrom,
        votingHistory: apiUserData.votingHistory
      });
    } catch (error) {
      console.error('Error loading governance data:', error);
      showNotification('error', 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async () => {
    if (!createProposalData.title || !createProposalData.description || !createProposalData.category) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    setOperationLoading(true);
    try {
      const proposalData: CreateProposalData = {
        title: createProposalData.title,
        description: createProposalData.description,
        category: createProposalData.category,
        actions: [] // 简化版本，不包含具体操作
      };

      const result = await GovernanceService.createProposal(proposalData);
      
      if (result.success) {
        setShowCreateModal(false);
        setCreateProposalData({ title: '', description: '', category: '', type: 'general' });
        showNotification('success', result.message || 'Proposal created successfully');
        await loadGovernanceData(); // 重新加载数据
      } else {
        showNotification('error', result.message || 'Failed to create proposal');
      }
    } catch (error) {
      console.error('Failed to create proposal:', error);
      showNotification('error', 'Failed to create proposal');
    } finally {
      setOperationLoading(false);
    }
  };

  const voteOnProposal = async (proposalId: number, support: boolean) => {
    setOperationLoading(true);
    try {
      const voteData: VoteData = {
        proposalId: proposalId.toString(),
        support: support ? 'for' : 'against'
      };

      const result = await GovernanceService.vote(voteData);
      
      if (result.success) {
        showNotification('success', result.message || 'Vote cast successfully');
        await loadGovernanceData(); // 重新加载数据
        setSelectedProposal(null);
      } else {
        showNotification('error', result.message || 'Failed to cast vote');
      }
    } catch (error) {
      console.error('Failed to vote on proposal:', error);
      showNotification('error', 'Failed to cast vote');
    } finally {
      setOperationLoading(false);
    }
  };

  useEffect(() => {
    loadGovernanceData();
  }, []);

  // Mock data (作为后备数据)
  const mockProposals: Proposal[] = [
    {
      id: 1,
      title: 'Increase Artist Royalty Share',
      description: 'Propose to increase artist royalty share from 70% to 75% to better incentivize creators',
      proposer: '0x1234...5678',
      status: 'active',
      votesFor: 15420,
      votesAgainst: 3280,
      totalVotes: 18700,
      endTime: '2024-02-15',
      category: 'Economic Parameters'
    },
    {
      id: 2,
      title: 'Add NFT Music Collectibles Feature',
      description: 'Add NFT music collectibles feature to the platform, allowing artists to issue limited edition music NFTs',
      proposer: '0xabcd...efgh',
      status: 'active',
      votesFor: 12850,
      votesAgainst: 8420,
      totalVotes: 21270,
      endTime: '2024-02-20',
      category: 'Feature Upgrade'
    },
    {
      id: 3,
      title: 'Establish Community Fund',
      description: 'Allocate 5% of platform revenue to establish a community development fund for music education and newcomer support',
      proposer: '0x9876...5432',
      status: 'passed',
      votesFor: 25680,
      votesAgainst: 4320,
      totalVotes: 30000,
      endTime: '2024-01-30',
      category: 'Community'
    }
  ];

  const mockStats = {
    totalProposals: 127,
    activeProposals: 8,
    totalVotes: 2400000,
    userVotingPower: 1250
  };

  const governanceStatsDisplay = [
    {
      label: "Total Proposals",
      value: governanceStats?.totalProposals?.toString() || "127",
      color: "#3B82F6",
      icon: Vote
    },
    {
      label: "Active Proposals", 
      value: governanceStats?.activeProposals?.toString() || "8",
      color: "#10B981",
      icon: Clock
    },
    {
      label: "Total Votes",
      value: governanceStats?.totalVotes ? (governanceStats.totalVotes / 1000000).toFixed(1) + "M" : "2.4M",
      color: "#8B5CF6",
      icon: Users
    },
    {
      label: "My Voting Power",
      value: userVotingData?.votingPower?.toString() || governanceStats?.userVotingPower?.toString() || "1,250",
      color: "#F59E0B",
      icon: Coins
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400';
      case 'passed': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Clock;
      case 'passed': return CheckCircle;
      case 'rejected': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Voting';
      case 'passed': return 'Passed';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="cyber-grid opacity-20" />
      
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.message}
        </motion.div>
      )}
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            DAO Governance Center
          </h1>
          <p className="text-gray-300">
            Participate in platform governance and jointly decide the future development direction of MusicFi
          </p>
        </motion.div>

        {/* Governance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {governanceStatsDisplay.map((stat, index) => (
            <Card key={index} variant="glass" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon 
                    className="w-6 h-6" 
                    style={{ color: stat.color }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card variant="glass" className="p-2">
            <div className="flex space-x-2">
              {[
                { key: 'proposals', label: 'Proposal List', icon: Vote },
                { key: 'voting', label: 'My Votes', icon: User },
                { key: 'tokens', label: 'Governance Tokens', icon: Coins }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Governance Proposals</h2>
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                variant="primary"
              >
                Create Proposal
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {proposals.map((proposal, index) => {
                const StatusIcon = getStatusIcon(proposal.status);
                const votePercentage = proposal.totalVotes > 0 
                  ? (proposal.votesFor / proposal.totalVotes) * 100 
                  : 0;

                return (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card 
                      variant="glass" 
                      className="p-6 cursor-pointer hover:bg-gray-800/50 transition-all"
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-white">
                              {proposal.title}
                            </h3>
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                              {proposal.category}
                            </span>
                          </div>
                          <p className="text-gray-300 mb-3 line-clamp-2">
                            {proposal.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {proposal.proposer}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Deadline: {proposal.endTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <StatusIcon className={`w-5 h-5 ${getStatusColor(proposal.status)}`} />
                          <span className={`text-sm font-medium ${getStatusColor(proposal.status)}`}>
                            {getStatusText(proposal.status)}
                          </span>
                        </div>
                      </div>

                      {/* Vote Progress */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Voting Progress</span>
                          <span className="text-white">
                            {proposal.totalVotes.toLocaleString()} votes
                          </span>
                        </div>
                        
                        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${votePercentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span className="text-gray-300">
                              Support: {proposal.votesFor.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <span className="text-gray-300">
                              Against: {proposal.votesAgainst.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
              </div>
            )}
          </motion.div>
        )}

        {/* Voting Tab */}
        {activeTab === 'voting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card variant="glass" className="p-8 text-center">
              <Vote className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">My Voting Records</h3>
              <p className="text-gray-400 mb-6">
                View all voting activities and voting history you participated in
              </p>
              <Button variant="primary">View Voting History</Button>
            </Card>
          </motion.div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            <Card variant="glass" className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">My Governance Tokens</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {userVotingData?.votingPower?.toLocaleString() || '1,250'}
                  </div>
                  <div className="text-gray-300 text-sm">Voting Power</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {userVotingData?.votingHistory?.length || '12'}
                  </div>
                  <div className="text-gray-300 text-sm">Votes Cast</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">
                    {userVotingData?.delegatedFrom?.length || '0'}
                  </div>
                  <div className="text-gray-300 text-sm">Delegated From</div>
                </div>
              </div>
              
              {userVotingData?.delegatedTo && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      Voting power delegated to: {userVotingData.delegatedTo}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            <Card variant="glass" className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Get Governance Tokens</h3>
              <p className="text-gray-300 mb-4">
                Obtain governance tokens through the following methods to participate in platform governance:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <Coins className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Automatically gain governance rights by holding MRT tokens</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300">Participate in community activities to earn reward tokens</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <span className="text-gray-300">Provide liquidity to earn governance token rewards</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Create Proposal Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Proposal"
        size="lg"
      >
        <div className="space-y-6">
          <Input
            label="Proposal Title"
            placeholder="Enter proposal title..."
            value={createProposalData.title}
            onChange={(e) => setCreateProposalData(prev => ({ ...prev, title: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proposal Description
            </label>
            <textarea
              className="w-full h-32 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Describe your proposal in detail..."
              value={createProposalData.description}
              onChange={(e) => setCreateProposalData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proposal Category
            </label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              value={createProposalData.category}
              onChange={(e) => setCreateProposalData(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Select category...</option>
              <option value="Economic Parameters">Economic Parameters</option>
              <option value="Feature Upgrade">Feature Upgrade</option>
              <option value="Community">Community</option>
              <option value="DeFi Strategy">DeFi Strategy</option>
              <option value="Technical">Technical</option>
              <option value="Treasury">Treasury</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proposal Type
            </label>
            <select
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              value={createProposalData.type}
              onChange={(e) => setCreateProposalData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="general">General</option>
              <option value="treasury">Treasury</option>
              <option value="parameter">Parameter</option>
              <option value="upgrade">Upgrade</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={createProposal}
              disabled={!createProposalData.title || !createProposalData.description || !createProposalData.category || operationLoading}
            >
              {operationLoading ? 'Creating...' : 'Submit Proposal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <Modal
          isOpen={!!selectedProposal}
          onClose={() => setSelectedProposal(null)}
          title={selectedProposal.title}
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">Proposal Details</h4>
              <p className="text-gray-300">{selectedProposal.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400 text-sm">Proposer</span>
                <p className="text-white">{selectedProposal.proposer}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Deadline</span>
                <p className="text-white">{selectedProposal.endTime}</p>
              </div>
            </div>

            {selectedProposal.status === 'active' && (
              <div className="flex gap-4">
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => voteOnProposal(selectedProposal.id, true)}
                  disabled={operationLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {operationLoading ? 'Voting...' : 'Support'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => voteOnProposal(selectedProposal.id, false)}
                  disabled={operationLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {operationLoading ? 'Voting...' : 'Against'}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GovernancePage;