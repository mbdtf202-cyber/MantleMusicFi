const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// 中间件
const authMiddleware = (req, res, next) => {
  // 模拟认证中间件
  req.user = { 
    id: 'user123', 
    address: '0x1234567890123456789012345678901234567890',
    role: 'member'
  };
  next();
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 模拟数据
let proposals = [
  {
    id: 1,
    title: "增加艺术家版税分成比例",
    description: "提议将艺术家版税分成从70%提高到75%，以更好地激励创作者",
    proposer: "0x1234567890123456789012345678901234567890",
    proposerName: "Alice Johnson",
    type: "PARAMETER",
    status: "ACTIVE",
    startTime: Date.now() - 86400000, // 1 day ago
    endTime: Date.now() + 6 * 86400000, // 6 days from now
    executionTime: null,
    forVotes: 15420,
    againstVotes: 3280,
    abstainVotes: 1100,
    totalVotes: 19800,
    quorumRequired: 8000,
    executed: false,
    canceled: false,
    targets: ["0xContractAddress"],
    values: [0],
    calldatas: ["0x"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "平台治理代币分发计划",
    description: "提议向活跃用户和艺术家分发治理代币，促进社区参与",
    proposer: "0x2345678901234567890123456789012345678901",
    proposerName: "Bob Smith",
    type: "TREASURY",
    status: "SUCCEEDED",
    startTime: Date.now() - 7 * 86400000,
    endTime: Date.now() - 86400000,
    executionTime: Date.now() + 2 * 86400000,
    forVotes: 22500,
    againstVotes: 1800,
    abstainVotes: 700,
    totalVotes: 25000,
    quorumRequired: 8000,
    executed: false,
    canceled: false,
    targets: ["0xTreasuryAddress"],
    values: [0],
    calldatas: ["0x"],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    title: "紧急安全补丁部署",
    description: "发现智能合约安全漏洞，需要紧急部署安全补丁",
    proposer: "0x3456789012345678901234567890123456789012",
    proposerName: "Security Team",
    type: "EMERGENCY",
    status: "EXECUTED",
    startTime: Date.now() - 3 * 86400000,
    endTime: Date.now() - 2 * 86400000,
    executionTime: Date.now() - 86400000,
    forVotes: 18900,
    againstVotes: 500,
    abstainVotes: 600,
    totalVotes: 20000,
    quorumRequired: 5000,
    executed: true,
    canceled: false,
    targets: ["0xMainContract"],
    values: [0],
    calldatas: ["0x"],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

let votes = [
  {
    id: 1,
    proposalId: 1,
    voter: "0x1234567890123456789012345678901234567890",
    voterName: "Alice Johnson",
    support: 1, // 0=Against, 1=For, 2=Abstain
    weight: 1500,
    reason: "This will greatly benefit artists and encourage more quality content creation",
    timestamp: Date.now() - 12 * 3600000,
    transactionHash: "0xabc123..."
  },
  {
    id: 2,
    proposalId: 1,
    voter: "0x2345678901234567890123456789012345678901",
    voterName: "Bob Smith",
    support: 1,
    weight: 2200,
    reason: "Supporting artist-friendly policies",
    timestamp: Date.now() - 8 * 3600000,
    transactionHash: "0xdef456..."
  },
  {
    id: 3,
    proposalId: 1,
    voter: "0x3456789012345678901234567890123456789012",
    voterName: "Carol Davis",
    support: 0,
    weight: 800,
    reason: "Concerned about platform sustainability",
    timestamp: Date.now() - 4 * 3600000,
    transactionHash: "0xghi789..."
  }
];

let delegations = [
  {
    id: 1,
    delegator: "0x4567890123456789012345678901234567890123",
    delegate: "0x1234567890123456789012345678901234567890",
    delegatedPower: 5000,
    timestamp: Date.now() - 7 * 86400000,
    active: true
  },
  {
    id: 2,
    delegator: "0x5678901234567890123456789012345678901234",
    delegate: "0x2345678901234567890123456789012345678901",
    delegatedPower: 3200,
    timestamp: Date.now() - 5 * 86400000,
    active: true
  }
];

let governanceStats = {
  totalProposals: 15,
  activeProposals: 3,
  totalVoters: 1250,
  totalVotingPower: 125000,
  averageParticipation: 68.5,
  treasuryBalance: 2500000,
  governanceTokenSupply: 10000000,
  quorumThreshold: 4.0
};

// 提案相关路由

/**
 * @route GET /api/governance/proposals
 * @desc 获取提案列表
 */
router.get('/proposals', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'ACTIVE', 'CANCELED', 'DEFEATED', 'SUCCEEDED', 'QUEUED', 'EXPIRED', 'EXECUTED']),
  query('type').optional().isIn(['GENERAL', 'TREASURY', 'PARAMETER', 'UPGRADE', 'EMERGENCY']),
  query('proposer').optional().isEthereumAddress()
], validateRequest, (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, proposer } = req.query;
    
    let filteredProposals = [...proposals];
    
    // 应用过滤器
    if (status) {
      filteredProposals = filteredProposals.filter(p => p.status === status);
    }
    if (type) {
      filteredProposals = filteredProposals.filter(p => p.type === type);
    }
    if (proposer) {
      filteredProposals = filteredProposals.filter(p => p.proposer.toLowerCase() === proposer.toLowerCase());
    }
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProposals = filteredProposals.slice(startIndex, endIndex);
    
    res.json({
      proposals: paginatedProposals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredProposals.length / limit),
        totalItems: filteredProposals.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

/**
 * @route GET /api/governance/proposals/:id
 * @desc 获取特定提案详情
 */
router.get('/proposals/:id', [
  param('id').isInt({ min: 1 })
], validateRequest, (req, res) => {
  try {
    const proposalId = parseInt(req.params.id);
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    // 获取该提案的投票记录
    const proposalVotes = votes.filter(v => v.proposalId === proposalId);
    
    res.json({
      proposal,
      votes: proposalVotes,
      voteCount: proposalVotes.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proposal details' });
  }
});

/**
 * @route POST /api/governance/proposals
 * @desc 创建新提案
 */
router.post('/proposals', authMiddleware, [
  body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').isLength({ min: 20, max: 5000 }).withMessage('Description must be 20-5000 characters'),
  body('type').isIn(['GENERAL', 'TREASURY', 'PARAMETER', 'UPGRADE', 'EMERGENCY']),
  body('targets').isArray({ min: 1 }).withMessage('At least one target required'),
  body('values').isArray({ min: 1 }).withMessage('At least one value required'),
  body('calldatas').isArray({ min: 1 }).withMessage('At least one calldata required'),
  body('executionDelay').optional().isInt({ min: 0 })
], validateRequest, (req, res) => {
  try {
    const { title, description, type, targets, values, calldatas, executionDelay = 172800 } = req.body;
    
    // 检查紧急提案权限
    if (type === 'EMERGENCY' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Emergency proposals require admin privileges' });
    }
    
    const newProposal = {
      id: proposals.length + 1,
      title,
      description,
      proposer: req.user.address,
      proposerName: req.user.name || 'Anonymous',
      type,
      status: 'PENDING',
      startTime: Date.now() + 86400000, // 1 day delay
      endTime: Date.now() + 7 * 86400000, // 7 days voting period
      executionTime: null,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      totalVotes: 0,
      quorumRequired: type === 'EMERGENCY' ? 5000 : 8000,
      executed: false,
      canceled: false,
      targets,
      values,
      calldatas,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    proposals.push(newProposal);
    
    res.status(201).json({
      message: 'Proposal created successfully',
      proposal: newProposal
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

/**
 * @route POST /api/governance/proposals/:id/vote
 * @desc 对提案投票
 */
router.post('/proposals/:id/vote', authMiddleware, [
  param('id').isInt({ min: 1 }),
  body('support').isInt({ min: 0, max: 2 }).withMessage('Support must be 0 (Against), 1 (For), or 2 (Abstain)'),
  body('reason').optional().isLength({ max: 1000 }).withMessage('Reason must be less than 1000 characters')
], validateRequest, (req, res) => {
  try {
    const proposalId = parseInt(req.params.id);
    const { support, reason = '' } = req.body;
    
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    if (proposal.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Proposal is not active for voting' });
    }
    
    // 检查是否已经投票
    const existingVote = votes.find(v => v.proposalId === proposalId && v.voter === req.user.address);
    if (existingVote) {
      return res.status(400).json({ error: 'Already voted on this proposal' });
    }
    
    // 模拟投票权重计算
    const votingWeight = Math.floor(Math.random() * 3000) + 500;
    
    const newVote = {
      id: votes.length + 1,
      proposalId,
      voter: req.user.address,
      voterName: req.user.name || 'Anonymous',
      support,
      weight: votingWeight,
      reason,
      timestamp: Date.now(),
      transactionHash: `0x${Math.random().toString(16).substr(2, 8)}...`
    };
    
    votes.push(newVote);
    
    // 更新提案投票统计
    if (support === 0) {
      proposal.againstVotes += votingWeight;
    } else if (support === 1) {
      proposal.forVotes += votingWeight;
    } else {
      proposal.abstainVotes += votingWeight;
    }
    proposal.totalVotes += votingWeight;
    proposal.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Vote cast successfully',
      vote: newVote,
      proposalStats: {
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        totalVotes: proposal.totalVotes
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

/**
 * @route POST /api/governance/proposals/:id/execute
 * @desc 执行提案
 */
router.post('/proposals/:id/execute', authMiddleware, [
  param('id').isInt({ min: 1 })
], validateRequest, (req, res) => {
  try {
    const proposalId = parseInt(req.params.id);
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    if (proposal.status !== 'SUCCEEDED') {
      return res.status(400).json({ error: 'Proposal must be in SUCCEEDED status to execute' });
    }
    
    if (proposal.executed) {
      return res.status(400).json({ error: 'Proposal already executed' });
    }
    
    // 模拟执行
    proposal.executed = true;
    proposal.status = 'EXECUTED';
    proposal.executionTime = Date.now();
    proposal.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Proposal executed successfully',
      proposal
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute proposal' });
  }
});

/**
 * @route POST /api/governance/proposals/:id/cancel
 * @desc 取消提案
 */
router.post('/proposals/:id/cancel', authMiddleware, [
  param('id').isInt({ min: 1 })
], validateRequest, (req, res) => {
  try {
    const proposalId = parseInt(req.params.id);
    const proposal = proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    // 只有提案者或管理员可以取消
    if (proposal.proposer !== req.user.address && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only proposer or admin can cancel proposal' });
    }
    
    if (proposal.executed || proposal.canceled) {
      return res.status(400).json({ error: 'Cannot cancel executed or already canceled proposal' });
    }
    
    proposal.canceled = true;
    proposal.status = 'CANCELED';
    proposal.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Proposal canceled successfully',
      proposal
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel proposal' });
  }
});

// 委托相关路由

/**
 * @route GET /api/governance/delegations
 * @desc 获取委托列表
 */
router.get('/delegations', authMiddleware, (req, res) => {
  try {
    const userDelegations = delegations.filter(d => 
      d.delegator === req.user.address || d.delegate === req.user.address
    );
    
    res.json({
      delegations: userDelegations,
      totalDelegated: userDelegations.reduce((sum, d) => sum + d.delegatedPower, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delegations' });
  }
});

/**
 * @route POST /api/governance/delegate
 * @desc 委托投票权
 */
router.post('/delegate', authMiddleware, [
  body('delegate').isEthereumAddress().withMessage('Invalid delegate address'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be positive')
], validateRequest, (req, res) => {
  try {
    const { delegate, amount } = req.body;
    
    if (delegate.toLowerCase() === req.user.address.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot delegate to yourself' });
    }
    
    // 检查是否已有委托给同一地址
    const existingDelegation = delegations.find(d => 
      d.delegator === req.user.address && d.delegate === delegate && d.active
    );
    
    if (existingDelegation) {
      return res.status(400).json({ error: 'Already delegated to this address' });
    }
    
    const newDelegation = {
      id: delegations.length + 1,
      delegator: req.user.address,
      delegate,
      delegatedPower: amount,
      timestamp: Date.now(),
      active: true
    };
    
    delegations.push(newDelegation);
    
    res.json({
      message: 'Voting power delegated successfully',
      delegation: newDelegation
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delegate voting power' });
  }
});

/**
 * @route POST /api/governance/revoke-delegation/:id
 * @desc 撤销委托
 */
router.post('/revoke-delegation/:id', authMiddleware, [
  param('id').isInt({ min: 1 })
], validateRequest, (req, res) => {
  try {
    const delegationId = parseInt(req.params.id);
    const delegation = delegations.find(d => d.id === delegationId);
    
    if (!delegation) {
      return res.status(404).json({ error: 'Delegation not found' });
    }
    
    if (delegation.delegator !== req.user.address) {
      return res.status(403).json({ error: 'Can only revoke your own delegations' });
    }
    
    delegation.active = false;
    
    res.json({
      message: 'Delegation revoked successfully',
      delegation
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke delegation' });
  }
});

// 统计和分析路由

/**
 * @route GET /api/governance/stats
 * @desc 获取治理统计信息
 */
router.get('/stats', (req, res) => {
  try {
    const activeProposals = proposals.filter(p => p.status === 'ACTIVE').length;
    const totalVotes = votes.length;
    const uniqueVoters = new Set(votes.map(v => v.voter)).size;
    
    const stats = {
      ...governanceStats,
      activeProposals,
      totalVotes,
      uniqueVoters,
      recentActivity: {
        proposalsThisWeek: proposals.filter(p => 
          new Date(p.createdAt) > new Date(Date.now() - 7 * 86400000)
        ).length,
        votesThisWeek: votes.filter(v => 
          v.timestamp > Date.now() - 7 * 86400000
        ).length
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch governance stats' });
  }
});

/**
 * @route GET /api/governance/user/:address/stats
 * @desc 获取用户治理统计
 */
router.get('/user/:address/stats', [
  param('address').isEthereumAddress()
], validateRequest, (req, res) => {
  try {
    const userAddress = req.params.address.toLowerCase();
    
    const userProposals = proposals.filter(p => p.proposer.toLowerCase() === userAddress);
    const userVotes = votes.filter(v => v.voter.toLowerCase() === userAddress);
    const userDelegations = delegations.filter(d => 
      d.delegator.toLowerCase() === userAddress || d.delegate.toLowerCase() === userAddress
    );
    
    const stats = {
      proposalsCreated: userProposals.length,
      votescast: userVotes.length,
      delegationsGiven: userDelegations.filter(d => d.delegator.toLowerCase() === userAddress).length,
      delegationsReceived: userDelegations.filter(d => d.delegate.toLowerCase() === userAddress).length,
      totalVotingPower: userDelegations
        .filter(d => d.delegate.toLowerCase() === userAddress && d.active)
        .reduce((sum, d) => sum + d.delegatedPower, 0),
      participationRate: userVotes.length / Math.max(proposals.length, 1) * 100,
      recentActivity: {
        lastVote: userVotes.length > 0 ? Math.max(...userVotes.map(v => v.timestamp)) : null,
        lastProposal: userProposals.length > 0 ? Math.max(...userProposals.map(p => new Date(p.createdAt).getTime())) : null
      }
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

/**
 * @route GET /api/governance/voting-power/:address
 * @desc 获取用户投票权重
 */
router.get('/voting-power/:address', [
  param('address').isEthereumAddress()
], validateRequest, (req, res) => {
  try {
    const userAddress = req.params.address.toLowerCase();
    
    // 模拟投票权重计算
    const baseTokenPower = Math.floor(Math.random() * 10000) + 1000;
    const reputationScore = Math.floor(Math.random() * 5000) + 500;
    const delegatedPower = delegations
      .filter(d => d.delegate.toLowerCase() === userAddress && d.active)
      .reduce((sum, d) => sum + d.delegatedPower, 0);
    
    const totalVotingPower = baseTokenPower + Math.floor(reputationScore * 0.3) + delegatedPower;
    
    res.json({
      address: userAddress,
      tokenBasedPower: baseTokenPower,
      reputationScore,
      delegatedPower,
      totalVotingPower,
      breakdown: {
        ownTokens: baseTokenPower,
        reputation: Math.floor(reputationScore * 0.3),
        delegated: delegatedPower
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voting power' });
  }
});

module.exports = router;