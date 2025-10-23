const express = require('express');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Music = require('../models/Music');
const User = require('../models/User');
const Token = require('../models/Token');
const Revenue = require('../models/Revenue');
const { auth, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadToIPFS, generateMetadata } = require('../services/ipfsService');
const { deployMusicToken, mintTokens } = require('../services/contractService');
const { calculateRoyalties, distributeRevenue } = require('../services/revenueService');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/music');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed for audio field'));
      }
    } else if (file.fieldname === 'cover') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for cover field'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

// 获取艺术家仪表板数据
router.get('/dashboard', auth, authorize('artist', 'admin'), asyncHandler(async (req, res) => {
  const artistId = req.user.id;
  
  // 获取艺术家的音乐作品
  const music = await Music.find({ artist: artistId })
    .populate('copyright.owner', 'username profile.firstName profile.lastName')
    .sort({ createdAt: -1 });
  
  // 获取代币信息
  const tokens = await Token.find({ creator: artistId })
    .sort({ createdAt: -1 });
  
  // 获取收益信息
  const revenues = await Revenue.find({ artist: artistId })
    .sort({ createdAt: -1 })
    .limit(10);
  
  // 计算统计数据
  const stats = {
    totalTracks: music.length,
    publishedTracks: music.filter(m => m.status === 'published').length,
    totalPlays: music.reduce((sum, m) => sum + (m.stats?.playCount || 0), 0),
    totalLikes: music.reduce((sum, m) => sum + (m.stats?.likeCount || 0), 0),
    totalTokens: tokens.length,
    totalRevenue: revenues.reduce((sum, r) => sum + r.amount, 0),
    monthlyRevenue: revenues
      .filter(r => r.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, r) => sum + r.amount, 0)
  };
  
  res.json({
    success: true,
    data: {
      stats,
      recentMusic: music.slice(0, 5),
      recentTokens: tokens.slice(0, 5),
      recentRevenues: revenues.slice(0, 5)
    }
  });
}));

// 上传音乐作品
router.post('/upload', [
  auth,
  authorize('artist', 'admin'),
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  body('title').notEmpty().trim().isLength({ max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('genre').isIn([
    'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Classical', 
    'Jazz', 'Blues', 'Country', 'Folk', 'R&B', 'Reggae', 
    'Punk', 'Metal', 'Alternative', 'Indie', 'Other'
  ]).withMessage('Invalid genre'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('lyrics').optional().isLength({ max: 5000 }).withMessage('Lyrics must be less than 5000 characters'),
  body('collaborators').optional().isArray().withMessage('Collaborators must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  if (!req.files?.audio?.[0]) {
    return res.status(400).json({
      success: false,
      message: 'Audio file is required'
    });
  }

  const {
    title,
    genre,
    duration,
    description,
    lyrics,
    collaborators = [],
    tags = []
  } = req.body;

  try {
    // 上传文件到IPFS
    const audioFile = req.files.audio[0];
    const coverFile = req.files.cover?.[0];
    
    const audioIPFS = await uploadToIPFS(audioFile.path);
    let coverIPFS = null;
    
    if (coverFile) {
      coverIPFS = await uploadToIPFS(coverFile.path);
    }
    
    // 生成元数据
    const metadata = generateMetadata({
      title,
      artist: req.user.username,
      genre,
      duration,
      description,
      lyrics,
      audioHash: audioIPFS.hash,
      coverHash: coverIPFS?.hash,
      collaborators,
      tags
    });
    
    const metadataIPFS = await uploadToIPFS(Buffer.from(JSON.stringify(metadata)), 'metadata.json');
    
    // 创建音乐记录
    const music = new Music({
      title,
      artist: req.user.id,
      genre,
      duration,
      description,
      lyrics,
      collaborators,
      tags,
      files: {
        audio: {
          filename: audioFile.filename,
          originalName: audioFile.originalname,
          size: audioFile.size,
          ipfsHash: audioIPFS.hash,
          ipfsUrl: audioIPFS.url
        },
        cover: coverFile ? {
          filename: coverFile.filename,
          originalName: coverFile.originalname,
          size: coverFile.size,
          ipfsHash: coverIPFS.hash,
          ipfsUrl: coverIPFS.url
        } : null,
        metadata: {
          ipfsHash: metadataIPFS.hash,
          ipfsUrl: metadataIPFS.url
        }
      },
      copyright: {
        owner: req.user.id,
        registrationDate: new Date(),
        isRegistered: true
      },
      status: 'draft'
    });
    
    await music.save();
    
    // 清理临时文件
    await fs.unlink(audioFile.path);
    if (coverFile) {
      await fs.unlink(coverFile.path);
    }
    
    res.status(201).json({
      success: true,
      message: 'Music uploaded successfully',
      data: music
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload music',
      error: error.message
    });
  }
}));

// 发行音乐代币
router.post('/:musicId/tokenize', [
  auth,
  authorize('artist', 'admin'),
  body('tokenName').notEmpty().trim().isLength({ max: 50 }).withMessage('Token name is required and must be less than 50 characters'),
  body('tokenSymbol').notEmpty().trim().isLength({ max: 10 }).withMessage('Token symbol is required and must be less than 10 characters'),
  body('totalSupply').isInt({ min: 1000, max: 1000000000 }).withMessage('Total supply must be between 1,000 and 1,000,000,000'),
  body('initialPrice').isFloat({ min: 0.001 }).withMessage('Initial price must be at least 0.001'),
  body('royaltyPercentage').isFloat({ min: 0, max: 50 }).withMessage('Royalty percentage must be between 0 and 50'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { musicId } = req.params;
  const {
    tokenName,
    tokenSymbol,
    totalSupply,
    initialPrice,
    royaltyPercentage,
    description
  } = req.body;

  // 验证音乐所有权
  const music = await Music.findById(musicId);
  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  if (music.artist.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only tokenize your own music'
    });
  }

  if (music.tokenContract) {
    return res.status(400).json({
      success: false,
      message: 'This music has already been tokenized'
    });
  }

  try {
    // 部署代币合约
    const contractResult = await deployMusicToken({
      name: tokenName,
      symbol: tokenSymbol,
      totalSupply,
      owner: req.user.walletAddress,
      musicMetadata: music.files.metadata.ipfsHash,
      royaltyPercentage: royaltyPercentage * 100 // 转换为基点
    });

    // 创建代币记录
    const token = new Token({
      name: tokenName,
      symbol: tokenSymbol,
      contractAddress: contractResult.contractAddress,
      totalSupply,
      initialPrice,
      currentPrice: initialPrice,
      royaltyPercentage,
      description,
      creator: req.user.id,
      music: musicId,
      metadata: {
        ipfsHash: music.files.metadata.ipfsHash,
        ipfsUrl: music.files.metadata.ipfsUrl
      },
      deploymentTx: contractResult.transactionHash,
      isActive: true
    });

    await token.save();

    // 更新音乐记录
    music.tokenContract = contractResult.contractAddress;
    music.tokenInfo = {
      name: tokenName,
      symbol: tokenSymbol,
      totalSupply,
      initialPrice,
      royaltyPercentage
    };
    await music.save();

    res.status(201).json({
      success: true,
      message: 'Music token created successfully',
      data: {
        token,
        contractAddress: contractResult.contractAddress,
        transactionHash: contractResult.transactionHash
      }
    });

  } catch (error) {
    console.error('Tokenization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create music token',
      error: error.message
    });
  }
}));

// 获取代币持有者列表
router.get('/:musicId/token/holders', auth, authorize('artist', 'admin'), asyncHandler(async (req, res) => {
  const { musicId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // 验证音乐所有权
  const music = await Music.findById(musicId);
  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  if (music.artist.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const token = await Token.findOne({ music: musicId });
  if (!token) {
    return res.status(404).json({
      success: false,
      message: 'Token not found'
    });
  }

  // 从区块链获取持有者信息（模拟数据）
  const holders = [
    {
      address: '0x1234567890123456789012345678901234567890',
      balance: '1000',
      percentage: 10.5,
      user: {
        username: 'investor1',
        profile: { firstName: 'John', lastName: 'Doe' }
      }
    },
    {
      address: '0x2345678901234567890123456789012345678901',
      balance: '750',
      percentage: 7.5,
      user: {
        username: 'investor2',
        profile: { firstName: 'Jane', lastName: 'Smith' }
      }
    }
  ];

  const total = holders.length;
  const skip = (page - 1) * limit;
  const paginatedHolders = holders.slice(skip, skip + limit);

  res.json({
    success: true,
    data: {
      holders: paginatedHolders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      tokenInfo: {
        name: token.name,
        symbol: token.symbol,
        totalSupply: token.totalSupply,
        currentPrice: token.currentPrice
      }
    }
  });
}));

// 获取收益报告
router.get('/revenue/report', [
  auth,
  authorize('artist', 'admin'),
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Invalid period'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { period = 'month', startDate, endDate } = req.query;
  const artistId = req.user.id;

  // 计算日期范围
  let dateFilter = {};
  const now = new Date();

  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  } else {
    switch (period) {
      case 'week':
        dateFilter = {
          createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        };
        break;
      case 'month':
        dateFilter = {
          createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        };
        break;
      case 'quarter':
        dateFilter = {
          createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
        };
        break;
      case 'year':
        dateFilter = {
          createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        };
        break;
    }
  }

  // 获取收益数据
  const revenues = await Revenue.find({
    artist: artistId,
    ...dateFilter
  }).populate('music', 'title genre').sort({ createdAt: -1 });

  // 按来源分组收益
  const revenueBySource = revenues.reduce((acc, revenue) => {
    const source = revenue.source || 'streaming';
    if (!acc[source]) {
      acc[source] = 0;
    }
    acc[source] += revenue.amount;
    return acc;
  }, {});

  // 按音乐分组收益
  const revenueByMusic = revenues.reduce((acc, revenue) => {
    const musicId = revenue.music?._id?.toString() || 'unknown';
    const musicTitle = revenue.music?.title || 'Unknown';
    if (!acc[musicId]) {
      acc[musicId] = {
        title: musicTitle,
        amount: 0,
        count: 0
      };
    }
    acc[musicId].amount += revenue.amount;
    acc[musicId].count += 1;
    return acc;
  }, {});

  // 计算统计数据
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const averageRevenue = revenues.length > 0 ? totalRevenue / revenues.length : 0;
  const topMusic = Object.entries(revenueByMusic)
    .sort(([,a], [,b]) => b.amount - a.amount)
    .slice(0, 5)
    .map(([id, data]) => ({ id, ...data }));

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        averageRevenue,
        transactionCount: revenues.length,
        period
      },
      revenueBySource,
      topMusic,
      recentTransactions: revenues.slice(0, 10),
      chartData: generateChartData(revenues, period)
    }
  });
}));

// 分配收益
router.post('/:musicId/distribute-revenue', [
  auth,
  authorize('artist', 'admin'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
  body('source').isIn(['streaming', 'sales', 'licensing', 'performance', 'sync', 'other']).withMessage('Invalid revenue source'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description must be less than 200 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { musicId } = req.params;
  const { amount, source, description } = req.body;

  // 验证音乐所有权
  const music = await Music.findById(musicId).populate('tokenContract');
  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  if (music.artist.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  try {
    // 计算版税分配
    const royalties = await calculateRoyalties(musicId, amount);
    
    // 执行收益分配
    const distributionResult = await distributeRevenue({
      musicId,
      amount,
      source,
      description,
      royalties,
      initiator: req.user.id
    });

    // 记录收益
    const revenue = new Revenue({
      artist: req.user.id,
      music: musicId,
      amount,
      source,
      description,
      distributionTx: distributionResult.transactionHash,
      royalties: royalties.map(r => ({
        recipient: r.address,
        amount: r.amount,
        percentage: r.percentage
      }))
    });

    await revenue.save();

    res.json({
      success: true,
      message: 'Revenue distributed successfully',
      data: {
        revenue,
        distributionResult,
        royalties
      }
    });

  } catch (error) {
    console.error('Revenue distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to distribute revenue',
      error: error.message
    });
  }
}));

// 获取艺术家的所有代币
router.get('/tokens', [
  auth,
  authorize('artist', 'admin'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'all']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { page = 1, limit = 20, status = 'all' } = req.query;
  const artistId = req.user.id;

  // 构建查询条件
  const query = { creator: artistId };
  if (status !== 'all') {
    query.isActive = status === 'active';
  }

  const skip = (page - 1) * limit;

  const [tokens, total] = await Promise.all([
    Token.find(query)
      .populate('music', 'title genre duration files.cover')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Token.countDocuments(query)
  ]);

  // 计算每个代币的额外统计信息
  const tokensWithStats = await Promise.all(tokens.map(async (token) => {
    // 获取持有者数量（模拟数据）
    const holderCount = Math.floor(Math.random() * 100) + 10;
    
    // 获取24小时交易量（模拟数据）
    const volume24h = Math.random() * 1000;
    
    // 计算价格变化（模拟数据）
    const priceChange24h = (Math.random() - 0.5) * 20; // -10% to +10%

    return {
      ...token.toObject(),
      stats: {
        holderCount,
        volume24h,
        priceChange24h,
        marketCap: token.totalSupply * token.currentPrice
      }
    };
  }));

  res.json({
    success: true,
    data: {
      tokens: tokensWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// 更新代币价格
router.patch('/tokens/:tokenId/price', [
  auth,
  authorize('artist', 'admin'),
  body('newPrice').isFloat({ min: 0.001 }).withMessage('New price must be at least 0.001')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { tokenId } = req.params;
  const { newPrice } = req.body;

  const token = await Token.findById(tokenId);
  if (!token) {
    return res.status(404).json({
      success: false,
      message: 'Token not found'
    });
  }

  if (token.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const oldPrice = token.currentPrice;
  token.currentPrice = newPrice;
  token.priceHistory.push({
    price: newPrice,
    timestamp: new Date(),
    updatedBy: req.user.id
  });

  await token.save();

  res.json({
    success: true,
    message: 'Token price updated successfully',
    data: {
      tokenId,
      oldPrice,
      newPrice,
      priceChange: ((newPrice - oldPrice) / oldPrice * 100).toFixed(2)
    }
  });
}));

// 辅助函数：生成图表数据
function generateChartData(revenues, period) {
  const groupBy = period === 'week' || period === 'month' ? 'day' : 'month';
  const data = {};

  revenues.forEach(revenue => {
    const date = new Date(revenue.createdAt);
    let key;
    
    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    }

    if (!data[key]) {
      data[key] = 0;
    }
    data[key] += revenue.amount;
  });

  return Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

module.exports = router;