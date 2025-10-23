const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  album: {
    type: String,
    trim: true,
    maxlength: 200
  },
  genre: {
    type: String,
    required: true,
    enum: [
      'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Classical', 
      'Jazz', 'Blues', 'Country', 'Folk', 'R&B', 'Reggae', 
      'Punk', 'Metal', 'Alternative', 'Indie', 'Other'
    ]
  },
  duration: {
    type: Number, // 秒数
    required: true,
    min: 1
  },
  description: {
    type: String,
    maxlength: 1000
  },
  lyrics: String,
  tags: [String],
  
  // 文件信息
  audioFile: {
    url: String,
    format: String,
    size: Number,
    quality: String // 'high', 'medium', 'low'
  },
  coverImage: {
    url: String,
    format: String,
    size: Number
  },
  
  // 区块链信息
  tokenId: {
    type: String,
    unique: true,
    sparse: true
  },
  contractAddress: String,
  mintTransactionHash: String,
  
  // 版权信息
  copyright: {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    royaltyPercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    collaborators: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String, // 'composer', 'lyricist', 'producer', etc.
      percentage: {
        type: Number,
        min: 0,
        max: 100
      }
    }]
  },
  
  // 统计信息
  stats: {
    playCount: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  
  // 状态
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'deleted'],
    default: 'draft'
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // 发布信息
  releaseDate: Date,
  publishedAt: Date,
  
  // AI 分析结果
  aiAnalysis: {
    mood: String,
    energy: Number,
    danceability: Number,
    valence: Number,
    acousticness: Number,
    instrumentalness: Number,
    liveness: Number,
    speechiness: Number,
    tempo: Number,
    key: String,
    mode: String,
    timeSignature: String,
    analyzedAt: Date
  }
}, {
  timestamps: true
});

// 索引
musicSchema.index({ artist: 1 });
musicSchema.index({ genre: 1 });
musicSchema.index({ status: 1 });
musicSchema.index({ publishedAt: -1 });
musicSchema.index({ 'stats.playCount': -1 });
musicSchema.index({ 'stats.likeCount': -1 });
musicSchema.index({ tokenId: 1 });
musicSchema.index({ title: 'text', album: 'text', tags: 'text' });

// 虚拟字段
musicSchema.virtual('isPublished').get(function() {
  return this.status === 'published';
});

// 方法
musicSchema.methods.incrementPlayCount = function() {
  this.stats.playCount += 1;
  return this.save();
};

musicSchema.methods.incrementLikeCount = function() {
  this.stats.likeCount += 1;
  return this.save();
};

musicSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Music', musicSchema);