const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  // 基本信息
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 10
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // 合约信息
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  deploymentTx: {
    type: String,
    required: true
  },
  chainId: {
    type: Number,
    default: 5000 // Mantle Network
  },
  
  // 代币经济学
  totalSupply: {
    type: Number,
    required: true,
    min: 1000
  },
  circulatingSupply: {
    type: Number,
    default: 0
  },
  initialPrice: {
    type: Number,
    required: true,
    min: 0.001
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0.001
  },
  marketCap: {
    type: Number,
    default: 0
  },
  
  // 版税信息
  royaltyPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  
  // 关联信息
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  music: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music',
    required: true
  },
  
  // 元数据
  metadata: {
    ipfsHash: String,
    ipfsUrl: String,
    attributes: [{
      trait_type: String,
      value: mongoose.Schema.Types.Mixed
    }]
  },
  
  // 价格历史
  priceHistory: [{
    price: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    volume: {
      type: Number,
      default: 0
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // 交易统计
  stats: {
    totalVolume: {
      type: Number,
      default: 0
    },
    volume24h: {
      type: Number,
      default: 0
    },
    priceChange24h: {
      type: Number,
      default: 0
    },
    priceChange7d: {
      type: Number,
      default: 0
    },
    holderCount: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    },
    lastTradeTime: Date
  },
  
  // 流动性信息
  liquidity: {
    totalLocked: {
      type: Number,
      default: 0
    },
    pools: [{
      poolAddress: String,
      pairToken: String,
      liquidity: Number,
      apr: Number
    }]
  },
  
  // 质押信息
  staking: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    totalStaked: {
      type: Number,
      default: 0
    },
    stakingRewards: {
      type: Number,
      default: 0
    },
    apr: {
      type: Number,
      default: 0
    }
  },
  
  // 治理信息
  governance: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    votingPower: {
      type: Number,
      default: 0
    },
    proposalCount: {
      type: Number,
      default: 0
    }
  },
  
  // 状态信息
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // 标签和分类
  tags: [String],
  category: {
    type: String,
    enum: ['music', 'album', 'single', 'ep', 'remix', 'collaboration'],
    default: 'music'
  },
  
  // 社交信息
  social: {
    website: String,
    twitter: String,
    discord: String,
    telegram: String
  },
  
  // 审计信息
  audit: {
    isAudited: {
      type: Boolean,
      default: false
    },
    auditReport: String,
    auditDate: Date,
    auditor: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
tokenSchema.index({ contractAddress: 1 });
tokenSchema.index({ creator: 1 });
tokenSchema.index({ music: 1 });
tokenSchema.index({ symbol: 1 });
tokenSchema.index({ isActive: 1 });
tokenSchema.index({ createdAt: -1 });
tokenSchema.index({ 'stats.volume24h': -1 });
tokenSchema.index({ 'stats.priceChange24h': -1 });

// 虚拟字段
tokenSchema.virtual('fullyDilutedMarketCap').get(function() {
  return this.totalSupply * this.currentPrice;
});

tokenSchema.virtual('priceChangePercentage').get(function() {
  if (this.priceHistory.length < 2) return 0;
  const currentPrice = this.currentPrice;
  const previousPrice = this.priceHistory[this.priceHistory.length - 2].price;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
});

// 中间件
tokenSchema.pre('save', function(next) {
  // 更新市值
  this.marketCap = this.circulatingSupply * this.currentPrice;
  
  // 更新价格变化
  if (this.priceHistory.length >= 2) {
    const currentPrice = this.currentPrice;
    const previousPrice = this.priceHistory[this.priceHistory.length - 2].price;
    this.stats.priceChange24h = ((currentPrice - previousPrice) / previousPrice) * 100;
  }
  
  next();
});

// 静态方法
tokenSchema.statics.findBySymbol = function(symbol) {
  return this.findOne({ symbol: symbol.toUpperCase() });
};

tokenSchema.statics.findByContract = function(contractAddress) {
  return this.findOne({ contractAddress: contractAddress.toLowerCase() });
};

tokenSchema.statics.getTopByVolume = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.volume24h': -1 })
    .limit(limit)
    .populate('creator', 'username profile.firstName profile.lastName')
    .populate('music', 'title genre');
};

tokenSchema.statics.getTopByMarketCap = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ marketCap: -1 })
    .limit(limit)
    .populate('creator', 'username profile.firstName profile.lastName')
    .populate('music', 'title genre');
};

// 实例方法
tokenSchema.methods.updatePrice = function(newPrice, volume = 0) {
  this.priceHistory.push({
    price: newPrice,
    timestamp: new Date(),
    volume: volume
  });
  
  this.currentPrice = newPrice;
  this.stats.lastTradeTime = new Date();
  
  // 保持价格历史记录在合理范围内
  if (this.priceHistory.length > 1000) {
    this.priceHistory = this.priceHistory.slice(-1000);
  }
  
  return this.save();
};

tokenSchema.methods.addLiquidity = function(poolAddress, pairToken, liquidity, apr) {
  const existingPool = this.liquidity.pools.find(p => p.poolAddress === poolAddress);
  
  if (existingPool) {
    existingPool.liquidity = liquidity;
    existingPool.apr = apr;
  } else {
    this.liquidity.pools.push({
      poolAddress,
      pairToken,
      liquidity,
      apr
    });
  }
  
  this.liquidity.totalLocked = this.liquidity.pools.reduce((sum, pool) => sum + pool.liquidity, 0);
  
  return this.save();
};

tokenSchema.methods.updateStats = function(stats) {
  Object.assign(this.stats, stats);
  return this.save();
};

module.exports = mongoose.model('Token', tokenSchema);