const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Music = require('../models/Music');
const User = require('../models/User');
const { auth, optionalAuth, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 获取音乐列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('genre').optional().isString().withMessage('Genre must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sort').optional().isIn(['newest', 'oldest', 'popular', 'trending']).withMessage('Invalid sort option')
], optionalAuth, asyncHandler(async (req, res) => {
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
    genre,
    search,
    sort = 'newest',
    artist
  } = req.query;

  // 构建查询条件
  const query = { status: 'published' };

  if (genre) {
    query.genre = genre;
  }

  if (artist) {
    query.artist = artist;
  }

  if (search) {
    query.$text = { $search: search };
  }

  // 构建排序条件
  let sortOption = {};
  switch (sort) {
    case 'newest':
      sortOption = { publishedAt: -1 };
      break;
    case 'oldest':
      sortOption = { publishedAt: 1 };
      break;
    case 'popular':
      sortOption = { 'stats.playCount': -1 };
      break;
    case 'trending':
      sortOption = { 'stats.likeCount': -1, publishedAt: -1 };
      break;
    default:
      sortOption = { publishedAt: -1 };
  }

  const skip = (page - 1) * limit;

  const [music, total] = await Promise.all([
    Music.find(query)
      .populate('artist', 'username profile.firstName profile.lastName profile.avatar')
      .populate('copyright.owner', 'username profile.firstName profile.lastName')
      .sort(sortOption)
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

// 获取单个音乐详情
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const music = await Music.findById(req.params.id)
    .populate('artist', 'username profile.firstName profile.lastName profile.avatar profile.bio')
    .populate('copyright.owner', 'username profile.firstName profile.lastName')
    .populate('copyright.collaborators.user', 'username profile.firstName profile.lastName');

  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  if (music.status !== 'published' && (!req.user || req.user._id.toString() !== music.artist._id.toString())) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  res.json({
    success: true,
    data: {
      music
    }
  });
}));

// 创建音乐
router.post('/', [
  auth,
  authorize('artist', 'admin'),
  body('title').notEmpty().trim().isLength({ max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('genre').isIn([
    'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Classical', 
    'Jazz', 'Blues', 'Country', 'Folk', 'R&B', 'Reggae', 
    'Punk', 'Metal', 'Alternative', 'Indie', 'Other'
  ]).withMessage('Invalid genre'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const musicData = {
    ...req.body,
    artist: req.user._id,
    copyright: {
      owner: req.user._id,
      royaltyPercentage: req.body.royaltyPercentage || 10
    }
  };

  const music = new Music(musicData);
  await music.save();

  await music.populate('artist', 'username profile.firstName profile.lastName profile.avatar');

  res.status(201).json({
    success: true,
    message: 'Music created successfully',
    data: {
      music
    }
  });
}));

// 更新音乐
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('genre').optional().isIn([
    'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Classical', 
    'Jazz', 'Blues', 'Country', 'Folk', 'R&B', 'Reggae', 
    'Punk', 'Metal', 'Alternative', 'Indie', 'Other'
  ]).withMessage('Invalid genre'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const music = await Music.findById(req.params.id);

  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  // 检查权限
  if (music.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  Object.assign(music, req.body);
  await music.save();

  await music.populate('artist', 'username profile.firstName profile.lastName profile.avatar');

  res.json({
    success: true,
    message: 'Music updated successfully',
    data: {
      music
    }
  });
}));

// 发布音乐
router.patch('/:id/publish', auth, asyncHandler(async (req, res) => {
  const music = await Music.findById(req.params.id);

  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  // 检查权限
  if (music.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (music.status === 'published') {
    return res.status(400).json({
      success: false,
      message: 'Music is already published'
    });
  }

  await music.publish();

  res.json({
    success: true,
    message: 'Music published successfully',
    data: {
      music
    }
  });
}));

// 播放音乐（增加播放次数）
router.post('/:id/play', optionalAuth, asyncHandler(async (req, res) => {
  const music = await Music.findById(req.params.id);

  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  if (music.status !== 'published') {
    return res.status(404).json({
      success: false,
      message: 'Music not available'
    });
  }

  await music.incrementPlayCount();

  res.json({
    success: true,
    message: 'Play count updated',
    data: {
      playCount: music.stats.playCount
    }
  });
}));

// 点赞音乐
router.post('/:id/like', auth, asyncHandler(async (req, res) => {
  const music = await Music.findById(req.params.id);

  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  await music.incrementLikeCount();

  res.json({
    success: true,
    message: 'Music liked successfully',
    data: {
      likeCount: music.stats.likeCount
    }
  });
}));

// 删除音乐
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const music = await Music.findById(req.params.id);

  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  // 检查权限
  if (music.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await Music.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Music deleted successfully'
  });
}));

// 获取音乐统计信息
router.get('/:id/stats', auth, asyncHandler(async (req, res) => {
  const music = await Music.findById(req.params.id);

  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  // 检查权限
  if (music.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: {
      stats: music.stats
    }
  });
}));

module.exports = router;