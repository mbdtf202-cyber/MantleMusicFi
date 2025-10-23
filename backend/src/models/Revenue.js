const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  // 基本信息
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  music: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music',
    required: true
  },
  
  // 收益信息
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'ETH', 'MNT', 'USDC', 'USDT']
  },
  
  // 收益来源
  source: {
    type: String,
    required: true,
    enum: [
      'streaming',      // 流媒体播放
      'sales',          // 直接销售
      'licensing',      // 授权费用
      'performance',    // 演出收入
      'sync',          // 同步授权
      'mechanical',     // 机械版税
      'digital',       // 数字销售
      'physical',      // 实体销售
      'subscription',   // 订阅收入
      'advertising',    // 广告收入
      'nft',           // NFT销售
      'token',         // 代币交易
      'staking',       // 质押奖励
      'governance',    // 治理奖励
      'other'          // 其他
    ]
  },
  
  // 详细描述
  description: {
    type: String,
    maxlength: 500
  },
  
  // 平台信息
  platform: {
    name: String,        // 平台名称 (Spotify, Apple Music, etc.)
    platformId: String,  // 平台上的ID
    reportId: String     // 报告ID
  },
  
  // 时间信息
  periodStart: Date,     // 收益期间开始
  periodEnd: Date,       // 收益期间结束
  reportDate: Date,      // 报告日期
  
  // 播放/销售数据
  metrics: {
    playCount: {
      type: Number,
      default: 0
    },
    uniqueListeners: {
      type: Number,
      default: 0
    },
    salesCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    streamingHours: {
      type: Number,
      default: 0
    }
  },
  
  // 地理分布
  geography: [{
    country: String,
    region: String,
    amount: Number,
    percentage: Number,
    playCount: Number
  }],
  
  // 版税分配
  royalties: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipientAddress: String,  // 钱包地址
    amount: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    role: {
      type: String,
      enum: ['artist', 'producer', 'songwriter', 'publisher', 'label', 'investor', 'collaborator'],
      required: true
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    transactionHash: String
  }],
  
  // 区块链信息
  blockchain: {
    distributionTx: String,    // 分配交易哈希
    tokenContract: String,     // 代币合约地址
    blockNumber: Number,       // 区块号
    gasUsed: Number,          // 消耗的Gas
    gasPrice: Number          // Gas价格
  },
  
  // 状态信息
  status: {
    type: String,
    enum: ['pending', 'processing', 'distributed', 'failed', 'disputed'],
    default: 'pending'
  },
  
  // 处理信息
  processing: {
    startedAt: Date,
    completedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    retryCount: {
      type: Number,
      default: 0
    },
    lastError: String
  },
  
  // 验证信息
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String
  },
  
  // 税务信息
  tax: {
    taxableAmount: Number,
    taxRate: Number,
    taxAmount: Number,
    taxJurisdiction: String,
    taxYear: Number
  },
  
  // 费用信息
  fees: {
    platformFee: {
      amount: Number,
      percentage: Number
    },
    processingFee: {
      amount: Number,
      percentage: Number
    },
    networkFee: {
      amount: Number
    },
    totalFees: Number
  },
  
  // 附件和文档
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 备注和标签
  notes: String,
  tags: [String],
  
  // 争议信息
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    disputedAt: Date,
    reason: String,
    resolution: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
revenueSchema.index({ artist: 1, createdAt: -1 });
revenueSchema.index({ music: 1, createdAt: -1 });
revenueSchema.index({ source: 1 });
revenueSchema.index({ status: 1 });
revenueSchema.index({ 'platform.name': 1 });
revenueSchema.index({ periodStart: 1, periodEnd: 1 });
revenueSchema.index({ amount: -1 });
revenueSchema.index({ 'verification.isVerified': 1 });
revenueSchema.index({ 'dispute.isDisputed': 1 });

// 复合索引
revenueSchema.index({ artist: 1, source: 1, createdAt: -1 });
revenueSchema.index({ music: 1, source: 1, amount: -1 });

// 虚拟字段
revenueSchema.virtual('netAmount').get(function() {
  const totalFees = this.fees?.totalFees || 0;
  return this.amount - totalFees;
});

revenueSchema.virtual('totalRoyalties').get(function() {
  return this.royalties.reduce((sum, royalty) => sum + royalty.amount, 0);
});

revenueSchema.virtual('unpaidRoyalties').get(function() {
  return this.royalties
    .filter(royalty => !royalty.isPaid)
    .reduce((sum, royalty) => sum + royalty.amount, 0);
});

revenueSchema.virtual('isFullyDistributed').get(function() {
  return this.royalties.every(royalty => royalty.isPaid);
});

// 中间件
revenueSchema.pre('save', function(next) {
  // 计算总费用
  if (this.fees) {
    this.fees.totalFees = (this.fees.platformFee?.amount || 0) +
                         (this.fees.processingFee?.amount || 0) +
                         (this.fees.networkFee || 0);
  }
  
  // 验证版税分配总和
  const totalRoyaltyPercentage = this.royalties.reduce((sum, royalty) => sum + royalty.percentage, 0);
  if (totalRoyaltyPercentage > 100) {
    return next(new Error('Total royalty percentage cannot exceed 100%'));
  }
  
  next();
});

// 静态方法
revenueSchema.statics.getRevenueByArtist = function(artistId, options = {}) {
  const {
    startDate,
    endDate,
    source,
    status = 'distributed',
    page = 1,
    limit = 20
  } = options;
  
  const query = { artist: artistId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  if (source) query.source = source;
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('music', 'title genre')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

revenueSchema.statics.getRevenueStats = function(artistId, period = 'month') {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        artist: mongoose.Types.ObjectId(artistId),
        createdAt: { $gte: startDate },
        status: 'distributed'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageRevenue: { $avg: '$amount' },
        revenueBySource: {
          $push: {
            source: '$source',
            amount: '$amount'
          }
        }
      }
    }
  ]);
};

revenueSchema.statics.getTopEarningMusic = function(artistId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        artist: mongoose.Types.ObjectId(artistId),
        status: 'distributed'
      }
    },
    {
      $group: {
        _id: '$music',
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        lastRevenue: { $max: '$createdAt' }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'music',
        localField: '_id',
        foreignField: '_id',
        as: 'musicInfo'
      }
    },
    {
      $unwind: '$musicInfo'
    }
  ]);
};

// 实例方法
revenueSchema.methods.distributeRoyalties = async function() {
  if (this.status !== 'pending') {
    throw new Error('Revenue must be in pending status to distribute');
  }
  
  this.status = 'processing';
  this.processing.startedAt = new Date();
  
  try {
    // 这里应该调用区块链服务来分配版税
    // 模拟分配过程
    for (let royalty of this.royalties) {
      // 模拟区块链交易
      royalty.transactionHash = '0x' + Math.random().toString(16).substr(2, 64);
      royalty.isPaid = true;
      royalty.paidAt = new Date();
    }
    
    this.status = 'distributed';
    this.processing.completedAt = new Date();
    
    return await this.save();
  } catch (error) {
    this.status = 'failed';
    this.processing.lastError = error.message;
    this.processing.retryCount += 1;
    
    await this.save();
    throw error;
  }
};

revenueSchema.methods.addRoyalty = function(recipient, amount, percentage, role) {
  this.royalties.push({
    recipient,
    amount,
    percentage,
    role
  });
  
  return this;
};

revenueSchema.methods.verify = function(verifiedBy, notes) {
  this.verification.isVerified = true;
  this.verification.verifiedBy = verifiedBy;
  this.verification.verifiedAt = new Date();
  this.verification.verificationNotes = notes;
  
  return this.save();
};

revenueSchema.methods.dispute = function(disputedBy, reason) {
  this.dispute.isDisputed = true;
  this.dispute.disputedBy = disputedBy;
  this.dispute.disputedAt = new Date();
  this.dispute.reason = reason;
  this.status = 'disputed';
  
  return this.save();
};

revenueSchema.methods.resolveDispute = function(resolvedBy, resolution) {
  this.dispute.resolution = resolution;
  this.dispute.resolvedAt = new Date();
  this.dispute.resolvedBy = resolvedBy;
  this.dispute.isDisputed = false;
  this.status = 'distributed';
  
  return this.save();
};

module.exports = mongoose.model('Revenue', revenueSchema);