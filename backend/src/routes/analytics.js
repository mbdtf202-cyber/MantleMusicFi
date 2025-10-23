const express = require('express');
const { query, validationResult } = require('express-validator');
const Music = require('../models/Music');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

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

module.exports = router;