const Revenue = require('../models/Revenue');

class RevenueService {
  // 创建收益记录
  async createRevenue(revenueData) {
    try {
      const revenue = new Revenue(revenueData);
      await revenue.save();
      return revenue;
    } catch (error) {
      console.error('Error creating revenue:', error);
      throw new Error('Failed to create revenue record');
    }
  }

  // 获取艺术家收益统计
  async getArtistRevenueStats(artistId, period = 'month') {
    try {
      return await Revenue.getRevenueStats(artistId, period);
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      throw new Error('Failed to get revenue statistics');
    }
  }

  // 获取艺术家收益列表
  async getArtistRevenues(artistId, options = {}) {
    try {
      return await Revenue.getRevenueByArtist(artistId, options);
    } catch (error) {
      console.error('Error getting artist revenues:', error);
      throw new Error('Failed to get artist revenues');
    }
  }

  // 获取热门收益音乐
  async getTopEarningMusic(artistId, limit = 10) {
    try {
      return await Revenue.getTopEarningMusic(artistId, limit);
    } catch (error) {
      console.error('Error getting top earning music:', error);
      throw new Error('Failed to get top earning music');
    }
  }

  // 分配版税
  async distributeRoyalties(revenueId) {
    try {
      const revenue = await Revenue.findById(revenueId);
      if (!revenue) {
        throw new Error('Revenue record not found');
      }

      await revenue.distributeRoyalties();
      return revenue;
    } catch (error) {
      console.error('Error distributing royalties:', error);
      throw new Error('Failed to distribute royalties');
    }
  }

  // 验证收益
  async verifyRevenue(revenueId, verifiedBy, notes) {
    try {
      const revenue = await Revenue.findById(revenueId);
      if (!revenue) {
        throw new Error('Revenue record not found');
      }

      await revenue.verify(verifiedBy, notes);
      return revenue;
    } catch (error) {
      console.error('Error verifying revenue:', error);
      throw new Error('Failed to verify revenue');
    }
  }

  // 创建争议
  async createDispute(revenueId, disputedBy, reason) {
    try {
      const revenue = await Revenue.findById(revenueId);
      if (!revenue) {
        throw new Error('Revenue record not found');
      }

      await revenue.createDispute(disputedBy, reason);
      return revenue;
    } catch (error) {
      console.error('Error creating dispute:', error);
      throw new Error('Failed to create dispute');
    }
  }

  // 解决争议
  async resolveDispute(revenueId, resolvedBy, resolution) {
    try {
      const revenue = await Revenue.findById(revenueId);
      if (!revenue) {
        throw new Error('Revenue record not found');
      }

      await revenue.resolveDispute(resolvedBy, resolution);
      return revenue;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw new Error('Failed to resolve dispute');
    }
  }

  // 添加版税接收者
  async addRoyalty(revenueId, recipient, amount, percentage, role) {
    try {
      const revenue = await Revenue.findById(revenueId);
      if (!revenue) {
        throw new Error('Revenue record not found');
      }

      revenue.addRoyalty(recipient, amount, percentage, role);
      await revenue.save();
      return revenue;
    } catch (error) {
      console.error('Error adding royalty:', error);
      throw new Error('Failed to add royalty');
    }
  }

  // 获取收益详情
  async getRevenueDetails(revenueId) {
    try {
      const revenue = await Revenue.findById(revenueId)
        .populate('artist', 'username email profile')
        .populate('music', 'title artist genre')
        .populate('royalties.recipient', 'username email')
        .populate('processing.processedBy', 'username')
        .populate('verification.verifiedBy', 'username')
        .populate('dispute.disputedBy', 'username')
        .populate('dispute.resolvedBy', 'username');

      if (!revenue) {
        throw new Error('Revenue record not found');
      }

      return revenue;
    } catch (error) {
      console.error('Error getting revenue details:', error);
      throw new Error('Failed to get revenue details');
    }
  }

  // 批量处理收益
  async batchProcessRevenues(revenueIds, processedBy) {
    try {
      const results = [];
      
      for (const revenueId of revenueIds) {
        try {
          const revenue = await Revenue.findById(revenueId);
          if (revenue && revenue.status === 'pending') {
            revenue.status = 'processing';
            revenue.processing.startedAt = new Date();
            revenue.processing.processedBy = processedBy;
            await revenue.save();
            
            // 这里可以添加实际的处理逻辑
            await revenue.distributeRoyalties();
            
            results.push({ revenueId, status: 'success' });
          }
        } catch (error) {
          results.push({ revenueId, status: 'error', error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error batch processing revenues:', error);
      throw new Error('Failed to batch process revenues');
    }
  }

  // 获取收益趋势数据
  async getRevenueTrends(artistId, period = '30d') {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const revenues = await Revenue.aggregate([
        {
          $match: {
            artist: artistId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            sources: { $addToSet: "$source" }
          }
        },
        {
          $sort: { "_id": 1 }
        }
      ]);

      return revenues;
    } catch (error) {
      console.error('Error getting revenue trends:', error);
      throw new Error('Failed to get revenue trends');
    }
  }

  // 生成收益报告
  async generateRevenueReport(artistId, startDate, endDate) {
    try {
      const revenues = await Revenue.find({
        artist: artistId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('music', 'title genre');

      const report = {
        period: { startDate, endDate },
        summary: {
          totalRevenue: 0,
          totalTransactions: revenues.length,
          averageRevenue: 0,
          topSource: null,
          topMusic: null
        },
        bySource: {},
        byMusic: {},
        byGeography: {},
        timeline: []
      };

      // 计算总收益
      report.summary.totalRevenue = revenues.reduce((sum, rev) => sum + rev.amount, 0);
      report.summary.averageRevenue = report.summary.totalRevenue / revenues.length || 0;

      // 按来源分组
      revenues.forEach(rev => {
        if (!report.bySource[rev.source]) {
          report.bySource[rev.source] = { amount: 0, count: 0 };
        }
        report.bySource[rev.source].amount += rev.amount;
        report.bySource[rev.source].count += 1;
      });

      // 找出最高收益来源
      const topSource = Object.entries(report.bySource)
        .sort(([,a], [,b]) => b.amount - a.amount)[0];
      report.summary.topSource = topSource ? topSource[0] : null;

      return report;
    } catch (error) {
      console.error('Error generating revenue report:', error);
      throw new Error('Failed to generate revenue report');
    }
  }
}

module.exports = new RevenueService();