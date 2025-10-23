const express = require('express');
const { query, body, validationResult } = require('express-validator');
const Music = require('../models/Music');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 模拟投资组合数据
let portfolios = {
  'user1': {
    userId: 'user1',
    totalValue: '15750000000000000000', // 15.75 ETH
    totalInvested: '12000000000000000000', // 12 ETH
    totalReturns: '3750000000000000000', // 3.75 ETH
    returnPercentage: 31.25,
    assets: [
      {
        tokenId: 'music-token-1',
        symbol: 'MUSIC1',
        name: 'Song Token 1',
        balance: '1000000000000000000000', // 1000 tokens
        value: '5000000000000000000', // 5 ETH
        invested: '4000000000000000000', // 4 ETH
        returns: '1000000000000000000', // 1 ETH
        returnPercentage: 25.0,
        price: '0.005000000000000000', // 0.005 ETH per token
        priceChange24h: 5.2,
        allocation: 31.75
      },
      {
        tokenId: 'music-token-2',
        symbol: 'MUSIC2',
        name: 'Song Token 2',
        balance: '500000000000000000000', // 500 tokens
        value: '4250000000000000000', // 4.25 ETH
        invested: '3000000000000000000', // 3 ETH
        returns: '1250000000000000000', // 1.25 ETH
        returnPercentage: 41.67,
        price: '0.008500000000000000', // 0.0085 ETH per token
        priceChange24h: -2.1,
        allocation: 26.98
      },
      {
        tokenId: 'artist-token-1',
        symbol: 'ART1',
        name: 'Artist Token 1',
        balance: '2000000000000000000000', // 2000 tokens
        value: '6500000000000000000', // 6.5 ETH
        invested: '5000000000000000000', // 5 ETH
        returns: '1500000000000000000', // 1.5 ETH
        returnPercentage: 30.0,
        price: '0.003250000000000000', // 0.00325 ETH per token
        priceChange24h: 8.7,
        allocation: 41.27
      }
    ],
    performance: {
      daily: 2.3,
      weekly: 8.1,
      monthly: 15.6,
      quarterly: 31.25,
      yearly: 125.4
    },
    lastUpdated: Date.now()
  }
};

// 模拟DeFi数据
let defiMetrics = {
  totalValueLocked: '45000000000000000000000', // 45,000 ETH
  totalBorrowed: '18000000000000000000000', // 18,000 ETH
  totalYieldGenerated: '2250000000000000000000', // 2,250 ETH
  averageAPY: 12.5,
  liquidityPools: [
    {
      pair: 'MUSIC/ETH',
      tvl: '8500000000000000000000', // 8,500 ETH
      volume24h: '1200000000000000000000', // 1,200 ETH
      apy: 15.2,
      fees24h: '36000000000000000000' // 36 ETH
    },
    {
      pair: 'ARTIST/ETH',
      tvl: '6200000000000000000000', // 6,200 ETH
      volume24h: '890000000000000000000', // 890 ETH
      apy: 18.7,
      fees24h: '26700000000000000000' // 26.7 ETH
    }
  ],
  lendingPools: [
    {
      asset: 'MUSIC',
      totalSupplied: '12000000000000000000000',
      totalBorrowed: '7200000000000000000000',
      supplyAPY: 8.5,
      borrowAPY: 12.3,
      utilizationRate: 60.0
    }
  ]
};

// 获取平台总体统计
router.get('/overview', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalArtists,
    totalMusic,
    publishedMusic,
    totalPlays,
    totalLikes
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'artist', isActive: true }),
    Music.countDocuments(),
    Music.countDocuments({ status: 'published' }),
    Music.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.playCount' } } }
    ]),
    Music.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.likeCount' } } }
    ])
  ]);

  // 获取最近30天的用户注册趋势
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // 获取音乐发布趋势
  const musicGrowth = await Music.aggregate([
    {
      $match: {
        publishedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$publishedAt' },
          month: { $month: '$publishedAt' },
          day: { $dayOfMonth: '$publishedAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalArtists,
        totalMusic,
        publishedMusic,
        totalPlays: totalPlays[0]?.total || 0,
        totalLikes: totalLikes[0]?.total || 0
      },
      trends: {
        userGrowth,
        musicGrowth
      }
    }
  });
}));

// 获取音乐统计
router.get('/music', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('genre').optional().isString().withMessage('Genre must be a string')
], asyncHandler(async (req, res) => {
  const { period = '30d', genre } = req.query;

  // 计算时间范围
  const now = new Date();
  const periodMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  
  const daysAgo = periodMap[period];
  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  // 构建查询条件
  const matchCondition = {
    status: 'published',
    publishedAt: { $gte: startDate }
  };

  if (genre) {
    matchCondition.genre = genre;
  }

  // 获取音乐统计
  const [
    genreStats,
    topMusic,
    playStats,
    artistStats
  ] = await Promise.all([
    // 按流派统计
    Music.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 },
          totalPlays: { $sum: '$stats.playCount' },
          totalLikes: { $sum: '$stats.likeCount' }
        }
      },
      { $sort: { count: -1 } }
    ]),

    // 热门音乐
    Music.find(matchCondition)
      .populate('artist', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ 'stats.playCount': -1 })
      .limit(10)
      .select('title artist stats genre publishedAt')
      .lean(),

    // 播放统计趋势
    Music.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
            day: { $dayOfMonth: '$publishedAt' }
          },
          totalPlays: { $sum: '$stats.playCount' },
          totalLikes: { $sum: '$stats.likeCount' },
          musicCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),

    // 艺术家统计
    Music.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$artist',
          musicCount: { $sum: 1 },
          totalPlays: { $sum: '$stats.playCount' },
          totalLikes: { $sum: '$stats.likeCount' },
          totalEarnings: { $sum: '$stats.totalEarnings' }
        }
      },
      { $sort: { totalPlays: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'artist'
        }
      },
      { $unwind: '$artist' },
      {
        $project: {
          artist: {
            _id: '$artist._id',
            username: '$artist.username',
            profile: '$artist.profile'
          },
          musicCount: 1,
          totalPlays: 1,
          totalLikes: 1,
          totalEarnings: 1
        }
      }
    ])
  ]);

  res.json({
    success: true,
    data: {
      genreStats,
      topMusic,
      playStats,
      artistStats,
      period
    }
  });
}));

// 获取用户统计
router.get('/users', [
  auth,
  authorize('admin'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // 计算时间范围
  const now = new Date();
  const periodMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  
  const daysAgo = periodMap[period];
  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const [
    roleStats,
    registrationStats,
    activeUsers,
    topUsers
  ] = await Promise.all([
    // 按角色统计
    User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]),

    // 注册统计
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),

    // 活跃用户（最近登录）
    User.countDocuments({
      lastLogin: { $gte: startDate },
      isActive: true
    }),

    // 顶级用户（按代币余额）
    User.find({ isActive: true })
      .sort({ tokenBalance: -1 })
      .limit(10)
      .select('username profile tokenBalance totalEarnings role')
      .lean()
  ]);

  res.json({
    success: true,
    data: {
      roleStats,
      registrationStats,
      activeUsers,
      topUsers,
      period
    }
  });
}));

// 获取收益统计
router.get('/revenue', [
  auth,
  authorize('admin'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;

  // 计算时间范围
  const now = new Date();
  const periodMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  };
  
  const daysAgo = periodMap[period];
  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const [
    totalRevenue,
    revenueByGenre,
    topEarningMusic,
    topEarningArtists
  ] = await Promise.all([
    // 总收益
    Music.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$stats.totalEarnings' }
        }
      }
    ]),

    // 按流派收益
    Music.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$genre',
          totalRevenue: { $sum: '$stats.totalEarnings' },
          musicCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),

    // 收益最高的音乐
    Music.find({ status: 'published' })
      .populate('artist', 'username profile.firstName profile.lastName')
      .sort({ 'stats.totalEarnings': -1 })
      .limit(10)
      .select('title artist stats.totalEarnings stats.playCount genre')
      .lean(),

    // 收益最高的艺术家
    Music.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$artist',
          totalEarnings: { $sum: '$stats.totalEarnings' },
          musicCount: { $sum: 1 },
          totalPlays: { $sum: '$stats.playCount' }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'artist'
        }
      },
      { $unwind: '$artist' },
      {
        $project: {
          artist: {
            _id: '$artist._id',
            username: '$artist.username',
            profile: '$artist.profile'
          },
          totalEarnings: 1,
          musicCount: 1,
          totalPlays: 1
        }
      }
    ])
  ]);

  res.json({
    success: true,
    data: {
      totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      revenueByGenre,
      topEarningMusic,
      topEarningArtists,
      period
    }
  });
}));

// 获取个人统计（艺术家）
router.get('/personal', [
  auth,
  authorize('artist', 'admin')
], asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    musicStats,
    recentPlays,
    monthlyStats,
    genreBreakdown
  ] = await Promise.all([
    // 音乐总体统计
    Music.aggregate([
      { $match: { artist: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPlays: { $sum: '$stats.playCount' },
          totalLikes: { $sum: '$stats.likeCount' },
          totalEarnings: { $sum: '$stats.totalEarnings' }
        }
      }
    ]),

    // 最近播放趋势（30天）
    Music.aggregate([
      { $match: { artist: userId, status: 'published' } },
      { $sort: { 'stats.playCount': -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          'stats.playCount': 1,
          'stats.likeCount': 1,
          'stats.totalEarnings': 1,
          publishedAt: 1
        }
      }
    ]),

    // 月度统计
    Music.aggregate([
      { $match: { artist: userId, status: 'published' } },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' }
          },
          musicCount: { $sum: 1 },
          totalPlays: { $sum: '$stats.playCount' },
          totalEarnings: { $sum: '$stats.totalEarnings' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]),

    // 流派分布
    Music.aggregate([
      { $match: { artist: userId, status: 'published' } },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 },
          totalPlays: { $sum: '$stats.playCount' },
          avgPlays: { $avg: '$stats.playCount' }
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);

  // 处理统计数据
  const stats = {
    published: 0,
    draft: 0,
    archived: 0,
    totalPlays: 0,
    totalLikes: 0,
    totalEarnings: 0
  };

  musicStats.forEach(stat => {
    stats[stat._id] = stat.count;
    stats.totalPlays += stat.totalPlays;
    stats.totalLikes += stat.totalLikes;
    stats.totalEarnings += stat.totalEarnings;
  });

  res.json({
    success: true,
    data: {
      overview: stats,
      recentPlays,
      monthlyStats,
      genreBreakdown
    }
  });
}));

/**
 * @route GET /api/analytics/portfolio/:userId
 * @desc 获取用户投资组合
 * @access Private
 */
router.get('/portfolio/:userId', auth, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const portfolio = portfolios[userId];

  if (!portfolio) {
    return res.status(404).json({
      success: false,
      message: 'Portfolio not found'
    });
  }

  // 计算额外的分析数据
  const analytics = {
    diversificationScore: calculateDiversificationScore(portfolio.assets),
    riskScore: calculateRiskScore(portfolio.assets),
    sharpeRatio: calculateSharpeRatio(portfolio.performance),
    volatility: calculateVolatility(portfolio.assets),
    beta: calculateBeta(portfolio.assets)
  };

  res.json({
    success: true,
    data: {
      portfolio,
      analytics
    }
  });
}));

/**
 * @route GET /api/analytics/portfolio/:userId/performance
 * @desc 获取投资组合表现历史
 * @access Private
 */
router.get('/portfolio/:userId/performance', [
  auth,
  query('period').optional().isIn(['1d', '7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('interval').optional().isIn(['1h', '4h', '1d', '1w']).withMessage('Invalid interval')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { userId } = req.params;
  const { period = '30d', interval = '1d' } = req.query;

  const portfolio = portfolios[userId];
  if (!portfolio) {
    return res.status(404).json({
      success: false,
      message: 'Portfolio not found'
    });
  }

  // 生成模拟的历史表现数据
  const performanceHistory = generatePerformanceHistory(portfolio, period, interval);

  res.json({
    success: true,
    data: {
      userId,
      period,
      interval,
      performance: performanceHistory,
      summary: {
        totalReturn: portfolio.returnPercentage,
        volatility: calculateVolatility(portfolio.assets),
        maxDrawdown: -8.5,
        sharpeRatio: calculateSharpeRatio(portfolio.performance)
      }
    }
  });
}));

/**
 * @route GET /api/analytics/market/overview
 * @desc 获取市场概览
 * @access Public
 */
router.get('/market/overview', asyncHandler(async (req, res) => {
  const overview = {
    totalMarketCap: '125000000000000000000000', // 125,000 ETH
    totalVolume24h: '8500000000000000000000', // 8,500 ETH
    totalAssets: 1247,
    totalArtists: 523,
    totalInvestors: 8934,
    topGainers: [
      {
        symbol: 'MUSIC3',
        name: 'Hit Song Token',
        price: '0.012500000000000000',
        change24h: 45.2,
        volume24h: '450000000000000000000'
      },
      {
        symbol: 'ART2',
        name: 'Rising Artist Token',
        price: '0.008750000000000000',
        change24h: 32.1,
        volume24h: '320000000000000000000'
      }
    ],
    topLosers: [
      {
        symbol: 'MUSIC4',
        name: 'Declining Song',
        price: '0.002100000000000000',
        change24h: -18.5,
        volume24h: '180000000000000000000'
      }
    ],
    marketTrends: {
      bullishSentiment: 68.5,
      fearGreedIndex: 72,
      socialSentiment: 'Positive',
      technicalIndicators: {
        rsi: 65.2,
        macd: 'Bullish',
        movingAverage: 'Above'
      }
    },
    sectorPerformance: [
      { sector: 'Pop Music', return24h: 5.2, marketCap: '35000000000000000000000' },
      { sector: 'Electronic', return24h: 8.7, marketCap: '28000000000000000000000' },
      { sector: 'Hip Hop', return24h: -2.1, marketCap: '22000000000000000000000' },
      { sector: 'Rock', return24h: 3.4, marketCap: '18000000000000000000000' },
      { sector: 'Classical', return24h: 1.8, marketCap: '12000000000000000000000' }
    ]
  };

  res.json({
    success: true,
    data: overview
  });
}));

/**
 * @route GET /api/analytics/defi/metrics
 * @desc 获取DeFi指标
 * @access Public
 */
router.get('/defi/metrics', asyncHandler(async (req, res) => {
  const metrics = {
    ...defiMetrics,
    protocolHealth: {
      collateralizationRatio: 185.5,
      liquidationRisk: 'Low',
      protocolRevenue24h: '125000000000000000000', // 125 ETH
      treasuryBalance: '5500000000000000000000' // 5,500 ETH
    },
    yieldFarming: [
      {
        pool: 'MUSIC-ETH LP',
        apy: 45.2,
        tvl: '3200000000000000000000',
        rewards: ['MUSIC', 'MRT'],
        riskLevel: 'Medium'
      },
      {
        pool: 'ARTIST-USDC LP',
        apy: 38.7,
        tvl: '2800000000000000000000',
        rewards: ['ARTIST', 'MRT'],
        riskLevel: 'Low'
      }
    ]
  };

  res.json({
    success: true,
    data: metrics
  });
}));

/**
 * @route GET /api/analytics/dashboard/:userId
 * @desc 获取用户仪表板数据
 * @access Private
 */
router.get('/dashboard/:userId', auth, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const dashboard = {
    user: {
      id: userId,
      totalPortfolioValue: portfolios[userId]?.totalValue || '0',
      totalReturns: portfolios[userId]?.totalReturns || '0',
      returnPercentage: portfolios[userId]?.returnPercentage || 0
    },
    quickStats: {
      assetsOwned: portfolios[userId]?.assets.length || 0,
      activeInvestments: 12,
      pendingTransactions: 3,
      totalYieldEarned: '850000000000000000' // 0.85 ETH
    },
    recentActivity: [
      {
        type: 'purchase',
        asset: 'MUSIC3',
        amount: '100000000000000000000',
        value: '1250000000000000000',
        timestamp: Date.now() - 3600000
      },
      {
        type: 'yield',
        asset: 'MUSIC-ETH LP',
        amount: '25000000000000000',
        timestamp: Date.now() - 7200000
      },
      {
        type: 'sale',
        asset: 'ART1',
        amount: '50000000000000000000',
        value: '162500000000000000',
        timestamp: Date.now() - 10800000
      }
    ],
    alerts: [
      {
        type: 'price_alert',
        message: 'MUSIC1 reached your target price of 0.006 ETH',
        severity: 'info',
        timestamp: Date.now() - 1800000
      },
      {
        type: 'yield_opportunity',
        message: 'New high-yield farming pool available: VIRAL1-ETH (65% APY)',
        severity: 'success',
        timestamp: Date.now() - 3600000
      }
    ],
    recommendations: [
      {
        type: 'diversification',
        title: 'Consider diversifying into Classical music tokens',
        description: 'Your portfolio is heavily weighted towards Pop and Electronic genres',
        priority: 'medium'
      },
      {
        type: 'yield_optimization',
        title: 'Optimize yield farming strategy',
        description: 'You could earn 15% more by reallocating to higher-yield pools',
        priority: 'high'
      }
    ]
  };

  res.json({
    success: true,
    data: dashboard
  });
}));

/**
 * @route GET /api/analytics/social/sentiment
 * @desc 获取社交情绪分析
 * @access Public
 */
router.get('/social/sentiment', [
  query('asset').optional().isString().withMessage('Asset must be a string'),
  query('timeframe').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid timeframe')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { asset, timeframe = '24h' } = req.query;

  const sentimentData = {
    overall: {
      score: 72.5,
      sentiment: 'Positive',
      confidence: 85.2,
      volume: 15420,
      sources: ['twitter', 'discord', 'telegram', 'reddit']
    },
    breakdown: {
      positive: 58.3,
      neutral: 28.1,
      negative: 13.6
    },
    keywords: [
      { word: 'bullish', count: 1250, sentiment: 'positive' },
      { word: 'moon', count: 890, sentiment: 'positive' },
      { word: 'dip', count: 650, sentiment: 'negative' },
      { word: 'hodl', count: 580, sentiment: 'positive' }
    ],
    influencers: [
      {
        username: 'crypto_music_guru',
        followers: 125000,
        sentiment: 'positive',
        influence_score: 92.5
      }
    ],
    trends: generateSentimentTrends(timeframe)
  };

  if (asset) {
    sentimentData.asset = asset;
    sentimentData.assetSpecific = generateAssetSentiment(asset);
  }

  res.json({
    success: true,
    data: sentimentData
  });
}));

// 辅助函数
function calculateDiversificationScore(assets) {
  const allocations = assets.map(asset => asset.allocation);
  const herfindahlIndex = allocations.reduce((sum, allocation) => {
    return sum + Math.pow(allocation / 100, 2);
  }, 0);
  return Math.max(0, (1 - herfindahlIndex) * 100);
}

function calculateRiskScore(assets) {
  const volatilities = assets.map(asset => Math.abs(asset.priceChange24h));
  const avgVolatility = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
  return Math.min(100, avgVolatility * 5);
}

function calculateSharpeRatio(performance) {
  const riskFreeRate = 2.0;
  const excessReturn = performance.yearly - riskFreeRate;
  const volatility = 25.0;
  return excessReturn / volatility;
}

function calculateVolatility(assets) {
  const changes = assets.map(asset => asset.priceChange24h);
  const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
  return Math.sqrt(variance);
}

function calculateBeta(assets) {
  return 1.2;
}

function generatePerformanceHistory(portfolio, period, interval) {
  const history = [];
  const now = Date.now();
  const periodMs = {
    '1d': 86400000,
    '7d': 604800000,
    '30d': 2592000000,
    '90d': 7776000000,
    '1y': 31536000000
  }[period];

  const intervalMs = {
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
    '1w': 604800000
  }[interval];

  const startTime = now - periodMs;
  const baseValue = parseFloat(portfolio.totalValue);

  for (let time = startTime; time <= now; time += intervalMs) {
    const progress = (time - startTime) / periodMs;
    const randomFactor = (Math.random() - 0.5) * 0.1;
    const trendFactor = progress * 0.3;
    const value = baseValue * (0.8 + trendFactor + randomFactor);

    history.push({
      timestamp: time,
      totalValue: value.toString(),
      returns: ((value - baseValue * 0.8) / (baseValue * 0.8) * 100).toFixed(2),
      assets: portfolio.assets.map(asset => ({
        symbol: asset.symbol,
        value: (parseFloat(asset.value) * (0.8 + trendFactor + randomFactor)).toString()
      }))
    });
  }

  return history;
}

function generateSentimentTrends(timeframe) {
  const trends = [];
  const now = Date.now();
  const intervalMs = timeframe === '1h' ? 300000 :
                   timeframe === '24h' ? 3600000 :
                   timeframe === '7d' ? 86400000 :
                   604800000;

  const periods = timeframe === '1h' ? 12 :
                 timeframe === '24h' ? 24 :
                 timeframe === '7d' ? 7 : 4;

  for (let i = periods; i >= 0; i--) {
    trends.push({
      timestamp: now - i * intervalMs,
      score: 50 + Math.random() * 40 + Math.sin(i * 0.5) * 10,
      volume: Math.floor(Math.random() * 1000 + 500)
    });
  }

  return trends;
}

function generateAssetSentiment(asset) {
  return {
    score: 65 + Math.random() * 30,
    mentions: Math.floor(Math.random() * 500 + 100),
    sentiment_breakdown: {
      positive: 45 + Math.random() * 30,
      neutral: 25 + Math.random() * 20,
      negative: 10 + Math.random() * 15
    },
    key_topics: ['price', 'technology', 'partnerships', 'adoption']
  };
}

module.exports = router;