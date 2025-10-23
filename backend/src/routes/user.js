const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Music = require('../models/Music');
const { auth, authorize, authorizeOwnerOrAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 获取用户列表（管理员）
router.get('/', [
  auth,
  authorize('admin'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'artist', 'admin']).withMessage('Invalid role'),
  query('search').optional().isString().withMessage('Search must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    page = 1,
    limit = 20,
    role,
    search,
    isActive
  } = req.query;

  // 构建查询条件
  const query = {};

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// 获取用户详情
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // 获取用户的音乐统计
  const musicStats = await Music.aggregate([
    { $match: { artist: user._id } },
    {
      $group: {
        _id: null,
        totalTracks: { $sum: 1 },
        totalPlays: { $sum: '$stats.playCount' },
        totalLikes: { $sum: '$stats.likeCount' },
        totalEarnings: { $sum: '$stats.totalEarnings' }
      }
    }
  ]);

  const stats = musicStats[0] || {
    totalTracks: 0,
    totalPlays: 0,
    totalLikes: 0,
    totalEarnings: 0
  };

  res.json({
    success: true,
    data: {
      user: {
        ...user.toObject(),
        stats
      }
    }
  });
}));

// 更新用户资料
router.put('/:id', [
  auth,
  authorizeOwnerOrAdmin(),
  body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('profile.firstName').optional().isLength({ max: 50 }).withMessage('First name must be less than 50 characters'),
  body('profile.lastName').optional().isLength({ max: 50 }).withMessage('Last name must be less than 50 characters'),
  body('profile.bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // 检查用户名和邮箱唯一性
  if (req.body.username && req.body.username !== user.username) {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
  }

  if (req.body.email && req.body.email !== user.email) {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
  }

  // 更新用户信息
  Object.assign(user, req.body);
  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user
    }
  });
}));

// 更改用户角色（管理员）
router.patch('/:id/role', [
  auth,
  authorize('admin'),
  body('role').isIn(['user', 'artist', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.role = req.body.role;
  await user.save();

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: {
      user
    }
  });
}));

// 激活/停用用户（管理员）
router.patch('/:id/status', [
  auth,
  authorize('admin'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isActive = req.body.isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user
    }
  });
}));

// 获取用户的音乐作品
router.get('/:id/music', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    page = 1,
    limit = 20,
    status = 'published'
  } = req.query;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const query = { artist: user._id };

  // 如果不是用户本人或管理员，只显示已发布的音乐
  if (!req.user || (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin')) {
    query.status = 'published';
  } else if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [music, total] = await Promise.all([
    Music.find(query)
      .populate('artist', 'username profile.firstName profile.lastName profile.avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Music.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      music,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// 删除用户（管理员）
router.delete('/:id', [
  auth,
  authorize('admin')
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // 检查是否有关联的音乐作品
  const musicCount = await Music.countDocuments({ artist: user._id });
  
  if (musicCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user with existing music tracks. Please transfer or delete music first.'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// 获取用户统计信息
router.get('/:id/stats', [
  auth,
  authorizeOwnerOrAdmin()
], asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // 获取详细统计信息
  const [musicStats, recentActivity] = await Promise.all([
    Music.aggregate([
      { $match: { artist: user._id } },
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
    Music.find({ artist: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt stats.playCount stats.likeCount')
      .lean()
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
      stats,
      recentActivity
    }
  });
}));

module.exports = router;