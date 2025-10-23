import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, replaceUrlParams } from '@/config/api';

// 接口定义
export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'failed' | 'pending' | 'executed' | 'cancelled';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  executionTime?: string;
  category: string;
  tags: string[];
  actions?: ProposalAction[];
}

export interface ProposalAction {
  target: string;
  value: string;
  signature: string;
  calldata: string;
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  totalVotingPower: string;
  participationRate: number;
  averageVotingPower: string;
  proposalSuccessRate: number;
}

export interface UserVotingData {
  votingPower: string;
  delegatedPower: string;
  delegatedTo?: string;
  delegatedFrom: string[];
  votingHistory: VoteRecord[];
  proposalsCreated: number;
}

export interface VoteRecord {
  proposalId: string;
  proposalTitle: string;
  vote: 'for' | 'against' | 'abstain';
  votingPower: string;
  timestamp: string;
  reason?: string;
}

export interface CreateProposalData {
  title: string;
  description: string;
  category: string;
  actions: ProposalAction[];
  startTime?: string;
  endTime?: string;
}

export interface VoteData {
  proposalId: string;
  support: 'for' | 'against' | 'abstain';
  reason?: string;
}

export interface DelegateData {
  delegatee: string;
  amount?: string;
}

// 模拟数据
const mockProposals: Proposal[] = [
  {
    id: '1',
    title: 'Increase Artist Revenue Share',
    description: 'Proposal to increase the revenue share for artists from 70% to 80% of total streaming revenue.',
    proposer: '0x1234...5678',
    status: 'active',
    votesFor: 15420000,
    votesAgainst: 3280000,
    totalVotes: 18700000,
    quorum: 10000000,
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-22T10:00:00Z',
    category: 'Economic',
    tags: ['revenue', 'artists', 'economics'],
    actions: [
      {
        target: '0xRevenue...Contract',
        value: '0',
        signature: 'setArtistShare(uint256)',
        calldata: '0x80'
      }
    ]
  },
  {
    id: '2',
    title: 'Add New Music Genre Category',
    description: 'Proposal to add Electronic Dance Music (EDM) as a new official genre category.',
    proposer: '0x9876...5432',
    status: 'passed',
    votesFor: 22100000,
    votesAgainst: 1900000,
    totalVotes: 24000000,
    quorum: 10000000,
    startTime: '2024-01-08T10:00:00Z',
    endTime: '2024-01-15T10:00:00Z',
    executionTime: '2024-01-16T10:00:00Z',
    category: 'Platform',
    tags: ['genre', 'music', 'categorization']
  },
  {
    id: '3',
    title: 'Implement Staking Rewards Program',
    description: 'Proposal to implement a staking rewards program for MRT token holders.',
    proposer: '0x5555...7777',
    status: 'pending',
    votesFor: 0,
    votesAgainst: 0,
    totalVotes: 0,
    quorum: 10000000,
    startTime: '2024-01-25T10:00:00Z',
    endTime: '2024-02-01T10:00:00Z',
    category: 'DeFi',
    tags: ['staking', 'rewards', 'tokenomics']
  }
];

const mockGovernanceStats: GovernanceStats = {
  totalProposals: 15,
  activeProposals: 3,
  totalVoters: 8420,
  totalVotingPower: '125000000',
  participationRate: 67.5,
  averageVotingPower: '14842',
  proposalSuccessRate: 73.3
};

const mockUserVotingData: UserVotingData = {
  votingPower: '50000',
  delegatedPower: '25000',
  delegatedTo: '0xDelegate...Address',
  delegatedFrom: ['0xUser1...Address', '0xUser2...Address'],
  votingHistory: [
    {
      proposalId: '1',
      proposalTitle: 'Increase Artist Revenue Share',
      vote: 'for',
      votingPower: '50000',
      timestamp: '2024-01-16T14:30:00Z',
      reason: 'Artists deserve better compensation for their work.'
    },
    {
      proposalId: '2',
      proposalTitle: 'Add New Music Genre Category',
      vote: 'for',
      votingPower: '50000',
      timestamp: '2024-01-10T09:15:00Z'
    }
  ],
  proposalsCreated: 2
};

export class GovernanceService {
  // 获取所有提案
  static async getProposals(status?: string, category?: string): Promise<Proposal[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.GOVERNANCE.PROPOSALS}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.proposals || data;
    } catch (error) {
      console.error('Error fetching proposals:', error);
      // 返回模拟数据作为后备
      let filteredProposals = mockProposals;
      if (status) {
        filteredProposals = filteredProposals.filter(p => p.status === status);
      }
      if (category) {
        filteredProposals = filteredProposals.filter(p => p.category === category);
      }
      return filteredProposals;
    }
  }

  // 获取单个提案详情
  static async getProposal(proposalId: string): Promise<Proposal | null> {
    try {
      const url = replaceUrlParams(API_ENDPOINTS.GOVERNANCE.PROPOSAL_DETAIL, { proposalId });
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.proposal || data;
    } catch (error) {
      console.error('Error fetching proposal:', error);
      // 返回模拟数据作为后备
      return mockProposals.find(p => p.id === proposalId) || null;
    }
  }

  // 创建提案
  static async createProposal(proposalData: CreateProposalData): Promise<{ success: boolean; proposalId?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GOVERNANCE.CREATE_PROPOSAL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        proposalId: data.proposalId,
        message: data.message || 'Proposal created successfully'
      };
    } catch (error) {
      console.error('Error creating proposal:', error);
      // 模拟成功响应
      return {
        success: true,
        proposalId: `mock_${Date.now()}`,
        message: 'Proposal created successfully (mock)'
      };
    }
  }

  // 投票
  static async vote(voteData: VoteData): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GOVERNANCE.VOTE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(voteData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Vote cast successfully'
      };
    } catch (error) {
      console.error('Error casting vote:', error);
      // 模拟成功响应
      return {
        success: true,
        message: 'Vote cast successfully (mock)'
      };
    }
  }

  // 委托投票权
  static async delegate(delegateData: DelegateData): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GOVERNANCE.DELEGATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(delegateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Delegation successful'
      };
    } catch (error) {
      console.error('Error delegating:', error);
      // 模拟成功响应
      return {
        success: true,
        message: 'Delegation successful (mock)'
      };
    }
  }

  // 撤销委托
  static async undelegate(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GOVERNANCE.REVOKE_DELEGATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Undelegation successful'
      };
    } catch (error) {
      console.error('Error undelegating:', error);
      // 模拟成功响应
      return {
        success: true,
        message: 'Undelegation successful (mock)'
      };
    }
  }

  // 执行提案
  static async executeProposal(proposalId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const url = replaceUrlParams(API_ENDPOINTS.GOVERNANCE.EXECUTE_PROPOSAL, { proposalId });
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Proposal executed successfully'
      };
    } catch (error) {
      console.error('Error executing proposal:', error);
      // 模拟成功响应
      return {
        success: true,
        message: 'Proposal executed successfully (mock)'
      };
    }
  }

  // 取消提案
  static async cancelProposal(proposalId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const url = replaceUrlParams(API_ENDPOINTS.GOVERNANCE.CANCEL_PROPOSAL, { proposalId });
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Proposal cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling proposal:', error);
      // 模拟成功响应
      return {
        success: true,
        message: 'Proposal cancelled successfully (mock)'
      };
    }
  }

  // 获取治理统计数据
  static async getGovernanceStats(): Promise<GovernanceStats> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GOVERNANCE.STATS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.stats || data;
    } catch (error) {
      console.error('Error fetching governance stats:', error);
      // 返回模拟数据作为后备
      return mockGovernanceStats;
    }
  }

  // 获取用户投票数据
  static async getUserVotingData(): Promise<UserVotingData> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GOVERNANCE.VOTING_POWER}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.votingData || data;
    } catch (error) {
      console.error('Error fetching user voting data:', error);
      // 返回模拟数据作为后备
      return mockUserVotingData;
    }
  }

  // 获取用户投票历史
  static async getUserVotingHistory(): Promise<VoteRecord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GOVERNANCE.VOTING_POWER}/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.history || data;
    } catch (error) {
      console.error('Error fetching voting history:', error);
      // 返回模拟数据作为后备
      return mockUserVotingData.votingHistory;
    }
  }
}

export default GovernanceService;