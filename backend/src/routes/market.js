const express = require('express');
const router = express.Router();
const dataIntegration = require('../services/dataIntegration');

// 获取热门音乐投资标的
router.get('/trending-tracks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const tracks = await dataIntegration.getTrendingTracks(limit);
    
    res.json({
      success: true,
      data: tracks,
      count: tracks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trending tracks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending tracks',
      message: error.message
    });
  }
});

// 获取加密货币价格
router.get('/crypto-prices', async (req, res) => {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['bitcoin', 'ethereum', 'mantle'];
    const prices = await dataIntegration.getCryptoPrices(symbols);
    
    res.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crypto prices',
      message: error.message
    });
  }
});

// 获取 DeFi 协议数据
router.get('/defi-protocols', async (req, res) => {
  try {
    const protocols = await dataIntegration.getDeFiData();
    
    res.json({
      success: true,
      data: protocols,
      count: protocols.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching DeFi data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DeFi data',
      message: error.message
    });
  }
});

// 获取综合市场数据
router.get('/overview', async (req, res) => {
  try {
    const marketData = await dataIntegration.getMarketData();
    
    res.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market overview',
      message: error.message
    });
  }
});

// 获取特定音乐的详细投资数据
router.get('/track/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;
    
    // 模拟获取特定音乐的详细数据
    const trackData = {
      id: trackId,
      name: 'Sample Track',
      artist: 'Sample Artist',
      currentPrice: Math.random() * 100 + 10,
      marketCap: Math.random() * 1000000 + 100000,
      volume24h: Math.random() * 50000 + 5000,
      priceChange24h: (Math.random() - 0.5) * 20,
      priceHistory: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        price: Math.random() * 100 + 10
      })),
      holders: Math.floor(Math.random() * 10000) + 1000,
      totalSupply: 1000000,
      circulatingSupply: Math.floor(Math.random() * 800000) + 200000
    };
    
    res.json({
      success: true,
      data: trackData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching track data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch track data',
      message: error.message
    });
  }
});

// 获取投资组合性能数据
router.get('/portfolio/:userId/performance', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '7d' } = req.query;
    
    // 模拟投资组合性能数据
    const performanceData = {
      userId,
      period,
      totalValue: Math.random() * 100000 + 10000,
      totalInvested: Math.random() * 80000 + 8000,
      totalReturn: Math.random() * 20000 + 2000,
      returnPercentage: (Math.random() - 0.3) * 50,
      dailyReturns: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.random() * 100000 + 10000,
        return: (Math.random() - 0.5) * 5000
      })),
      topPerformers: [
        { trackId: 'track1', name: 'Top Track 1', return: 25.5 },
        { trackId: 'track2', name: 'Top Track 2', return: 18.3 },
        { trackId: 'track3', name: 'Top Track 3', return: 12.7 }
      ],
      worstPerformers: [
        { trackId: 'track4', name: 'Poor Track 1', return: -8.2 },
        { trackId: 'track5', name: 'Poor Track 2', return: -5.1 }
      ]
    };
    
    res.json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching portfolio performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio performance',
      message: error.message
    });
  }
});

module.exports = router;