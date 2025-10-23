const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

// 模拟价格数据存储
let priceData = {
  'MUSIC-ETH': {
    price: '0.001234567890123456', // 18位精度
    timestamp: Date.now(),
    confidence: 95,
    sources: ['binance', 'uniswap', 'coingecko'],
    deviation: 150 // 基点
  },
  'ARTIST-ETH': {
    price: '0.000987654321098765',
    timestamp: Date.now(),
    confidence: 92,
    sources: ['uniswap', 'sushiswap'],
    deviation: 200
  }
};

// 模拟结算任务数据
let settlementTasks = [
  {
    id: 1,
    type: 'ROYALTY_DISTRIBUTION',
    initiator: '0x1234567890123456789012345678901234567890',
    recipients: [
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012'
    ],
    amounts: ['1000000000000000000', '500000000000000000'], // 1 ETH, 0.5 ETH
    token: '0x0000000000000000000000000000000000000000', // ETH
    totalAmount: '1500000000000000000',
    executionTime: Date.now() + 3600000, // 1小时后
    deadline: Date.now() + 86400000, // 24小时后
    status: 'PENDING',
    metadata: 'music-123',
    isRecurring: true,
    recurringInterval: 2592000000, // 30天
    createdAt: Date.now()
  }
];

// 模拟版税分配数据
let royaltyDistributions = {
  'music-123': {
    musicId: 'music-123',
    stakeholders: [
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012',
      '0x4567890123456789012345678901234567890123'
    ],
    percentages: [5000, 3000, 2000], // 50%, 30%, 20%
    totalRevenue: '5000000000000000000', // 5 ETH
    distributedAmount: '3000000000000000000', // 3 ETH
    lastDistribution: Date.now() - 86400000,
    isActive: true
  }
};

// 模拟交易结算数据
let tradeSettlements = [
  {
    tradeHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    buyer: '0x1111111111111111111111111111111111111111',
    seller: '0x2222222222222222222222222222222222222222',
    asset: '0x3333333333333333333333333333333333333333',
    amount: '100000000000000000000', // 100 tokens
    price: '1000000000000000', // 0.001 ETH per token
    paymentToken: '0x0000000000000000000000000000000000000000',
    settlementTime: Date.now() + 300000, // 5分钟后
    isEscrow: true,
    status: 'PENDING'
  }
];

// 模拟自动化规则数据
let automationRules = [
  {
    id: 1,
    creator: '0x1234567890123456789012345678901234567890',
    triggerType: 'ROYALTY_DISTRIBUTION',
    triggerCondition: {
      minRevenue: '1000000000000000000', // 1 ETH
      timeInterval: 86400000 // 24小时
    },
    executionData: {
      musicId: 'music-123',
      autoDistribute: true
    },
    gasLimit: 300000,
    gasPrice: '20000000000', // 20 Gwei
    isActive: true,
    lastExecution: 0,
    executionCount: 0,
    createdAt: Date.now()
  }
];

/**
 * @route GET /api/oracle/prices
 * @desc 获取价格数据
 * @access Public
 */
router.get('/prices', [
  query('symbols').optional().isString().withMessage('Symbols must be a string'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { symbols, limit = 10 } = req.query;
    let result = {};

    if (symbols) {
      const symbolList = symbols.split(',');
      symbolList.forEach(symbol => {
        if (priceData[symbol.trim()]) {
          result[symbol.trim()] = priceData[symbol.trim()];
        }
      });
    } else {
      result = priceData;
    }

    res.json({
      success: true,
      data: {
        prices: result,
        timestamp: Date.now(),
        count: Object.keys(result).length
      }
    });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prices',
      error: error.message
    });
  }
});

/**
 * @route GET /api/oracle/prices/:symbol
 * @desc 获取单个符号的价格
 * @access Public
 */
router.get('/prices/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = priceData[symbol];

    if (!price) {
      return res.status(404).json({
        success: false,
        message: 'Price not found for symbol'
      });
    }

    // 检查价格是否过期（超过1小时）
    const isStale = Date.now() - price.timestamp > 3600000;

    res.json({
      success: true,
      data: {
        symbol,
        price: price.price,
        timestamp: price.timestamp,
        confidence: price.confidence,
        sources: price.sources,
        deviation: price.deviation,
        isStale
      }
    });
  } catch (error) {
    console.error('Get price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price',
      error: error.message
    });
  }
});

/**
 * @route POST /api/oracle/prices
 * @desc 更新价格数据（仅授权预言机）
 * @access Private
 */
router.post('/prices', [
  auth,
  body('symbol').notEmpty().withMessage('Symbol is required'),
  body('price').notEmpty().withMessage('Price is required'),
  body('confidence').isInt({ min: 0, max: 100 }).withMessage('Confidence must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { symbol, price, confidence, sources = [] } = req.body;

    // 模拟授权检查
    const authorizedOracles = [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901'
    ];

    if (!authorizedOracles.includes(req.user.address)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized oracle'
      });
    }

    // 更新价格数据
    priceData[symbol] = {
      price,
      timestamp: Date.now(),
      confidence,
      sources: sources.length > 0 ? sources : ['manual'],
      deviation: Math.floor(Math.random() * 300) + 50 // 模拟偏差
    };

    res.json({
      success: true,
      message: 'Price updated successfully',
      data: {
        symbol,
        price,
        timestamp: priceData[symbol].timestamp
      }
    });
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update price',
      error: error.message
    });
  }
});

/**
 * @route GET /api/oracle/price-history/:symbol
 * @desc 获取价格历史
 * @access Public
 */
router.get('/price-history/:symbol', [
  query('from').optional().isInt().withMessage('From must be a timestamp'),
  query('to').optional().isInt().withMessage('To must be a timestamp'),
  query('interval').optional().isIn(['1h', '4h', '1d', '1w']).withMessage('Invalid interval')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { symbol } = req.params;
    const { from, to, interval = '1h' } = req.query;

    // 模拟历史价格数据
    const history = [];
    const now = Date.now();
    const intervalMs = {
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000
    }[interval];

    const startTime = from ? parseInt(from) : now - 30 * intervalMs;
    const endTime = to ? parseInt(to) : now;

    for (let time = startTime; time <= endTime; time += intervalMs) {
      const basePrice = parseFloat(priceData[symbol]?.price || '0.001');
      const variation = (Math.random() - 0.5) * 0.1; // ±10% 变化
      const price = (basePrice * (1 + variation)).toString();

      history.push({
        timestamp: time,
        price,
        volume: Math.floor(Math.random() * 1000000) + 100000, // 模拟交易量
        high: (parseFloat(price) * 1.05).toString(),
        low: (parseFloat(price) * 0.95).toString(),
        open: (parseFloat(price) * (1 + (Math.random() - 0.5) * 0.02)).toString(),
        close: price
      });
    }

    res.json({
      success: true,
      data: {
        symbol,
        interval,
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price history',
      error: error.message
    });
  }
});

/**
 * @route GET /api/settlement/tasks
 * @desc 获取结算任务列表
 * @access Private
 */
router.get('/settlement/tasks', [
  auth,
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  query('type').optional().isIn(['ROYALTY_DISTRIBUTION', 'TRADE_SETTLEMENT', 'YIELD_DISTRIBUTION', 'LOAN_REPAYMENT', 'INSURANCE_CLAIM']),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, type, page = 1, limit = 20 } = req.query;
    let filteredTasks = settlementTasks;

    // 过滤任务
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    if (type) {
      filteredTasks = filteredTasks.filter(task => task.type === type);
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        tasks: paginatedTasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredTasks.length,
          pages: Math.ceil(filteredTasks.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get settlement tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settlement tasks',
      error: error.message
    });
  }
});

/**
 * @route POST /api/settlement/tasks
 * @desc 创建结算任务
 * @access Private
 */
router.post('/settlement/tasks', [
  auth,
  body('type').isIn(['ROYALTY_DISTRIBUTION', 'TRADE_SETTLEMENT', 'YIELD_DISTRIBUTION', 'LOAN_REPAYMENT', 'INSURANCE_CLAIM']),
  body('recipients').isArray({ min: 1 }).withMessage('Recipients must be a non-empty array'),
  body('amounts').isArray({ min: 1 }).withMessage('Amounts must be a non-empty array'),
  body('token').notEmpty().withMessage('Token address is required'),
  body('executionTime').isInt({ min: Date.now() }).withMessage('Execution time must be in the future'),
  body('deadline').isInt().withMessage('Deadline is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      type,
      recipients,
      amounts,
      token,
      executionTime,
      deadline,
      metadata = '',
      isRecurring = false,
      recurringInterval = 0
    } = req.body;

    // 验证数组长度匹配
    if (recipients.length !== amounts.length) {
      return res.status(400).json({
        success: false,
        message: 'Recipients and amounts arrays must have the same length'
      });
    }

    // 计算总金额
    const totalAmount = amounts.reduce((sum, amount) => {
      return (BigInt(sum) + BigInt(amount)).toString();
    }, '0');

    // 创建新任务
    const newTask = {
      id: settlementTasks.length + 1,
      type,
      initiator: req.user.address,
      recipients,
      amounts,
      token,
      totalAmount,
      executionTime: parseInt(executionTime),
      deadline: parseInt(deadline),
      status: 'PENDING',
      metadata,
      isRecurring,
      recurringInterval: isRecurring ? parseInt(recurringInterval) : 0,
      createdAt: Date.now()
    };

    settlementTasks.push(newTask);

    res.status(201).json({
      success: true,
      message: 'Settlement task created successfully',
      data: {
        taskId: newTask.id,
        task: newTask
      }
    });
  } catch (error) {
    console.error('Create settlement task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create settlement task',
      error: error.message
    });
  }
});

/**
 * @route GET /api/settlement/tasks/:taskId
 * @desc 获取单个结算任务详情
 * @access Private
 */
router.get('/settlement/tasks/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = settlementTasks.find(t => t.id === parseInt(taskId));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Settlement task not found'
      });
    }

    res.json({
      success: true,
      data: {
        task
      }
    });
  } catch (error) {
    console.error('Get settlement task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settlement task',
      error: error.message
    });
  }
});

/**
 * @route POST /api/settlement/tasks/:taskId/execute
 * @desc 执行结算任务
 * @access Private
 */
router.post('/settlement/tasks/:taskId/execute', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskIndex = settlementTasks.findIndex(t => t.id === parseInt(taskId));

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Settlement task not found'
      });
    }

    const task = settlementTasks[taskIndex];

    if (task.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Task is not in pending status'
      });
    }

    if (Date.now() < task.executionTime) {
      return res.status(400).json({
        success: false,
        message: 'Too early to execute task'
      });
    }

    if (Date.now() > task.deadline) {
      return res.status(400).json({
        success: false,
        message: 'Task has expired'
      });
    }

    // 模拟执行过程
    settlementTasks[taskIndex].status = 'PROCESSING';

    // 模拟异步执行
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% 成功率
      settlementTasks[taskIndex].status = success ? 'COMPLETED' : 'FAILED';
      settlementTasks[taskIndex].executedAt = Date.now();

      if (success && task.isRecurring) {
        // 创建下一个循环任务
        const nextTask = {
          ...task,
          id: settlementTasks.length + 1,
          executionTime: task.executionTime + task.recurringInterval,
          deadline: task.deadline + task.recurringInterval,
          status: 'PENDING',
          createdAt: Date.now()
        };
        settlementTasks.push(nextTask);
      }
    }, 2000);

    res.json({
      success: true,
      message: 'Settlement task execution started',
      data: {
        taskId: task.id,
        status: 'PROCESSING'
      }
    });
  } catch (error) {
    console.error('Execute settlement task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute settlement task',
      error: error.message
    });
  }
});

/**
 * @route GET /api/settlement/royalty/:musicId
 * @desc 获取版税分配信息
 * @access Public
 */
router.get('/settlement/royalty/:musicId', async (req, res) => {
  try {
    const { musicId } = req.params;
    const distribution = royaltyDistributions[musicId];

    if (!distribution) {
      return res.status(404).json({
        success: false,
        message: 'Royalty distribution not found'
      });
    }

    res.json({
      success: true,
      data: {
        distribution
      }
    });
  } catch (error) {
    console.error('Get royalty distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get royalty distribution',
      error: error.message
    });
  }
});

/**
 * @route POST /api/settlement/royalty
 * @desc 创建版税分配
 * @access Private
 */
router.post('/settlement/royalty', [
  auth,
  body('musicId').notEmpty().withMessage('Music ID is required'),
  body('stakeholders').isArray({ min: 1 }).withMessage('Stakeholders must be a non-empty array'),
  body('percentages').isArray({ min: 1 }).withMessage('Percentages must be a non-empty array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { musicId, stakeholders, percentages } = req.body;

    // 验证数组长度匹配
    if (stakeholders.length !== percentages.length) {
      return res.status(400).json({
        success: false,
        message: 'Stakeholders and percentages arrays must have the same length'
      });
    }

    // 验证百分比总和为10000（100%）
    const totalPercentage = percentages.reduce((sum, pct) => sum + parseInt(pct), 0);
    if (totalPercentage !== 10000) {
      return res.status(400).json({
        success: false,
        message: 'Percentages must sum to 100% (10000 basis points)'
      });
    }

    // 创建版税分配
    royaltyDistributions[musicId] = {
      musicId,
      stakeholders,
      percentages,
      totalRevenue: '0',
      distributedAmount: '0',
      lastDistribution: 0,
      isActive: true,
      createdAt: Date.now(),
      creator: req.user.address
    };

    res.status(201).json({
      success: true,
      message: 'Royalty distribution created successfully',
      data: {
        distribution: royaltyDistributions[musicId]
      }
    });
  } catch (error) {
    console.error('Create royalty distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create royalty distribution',
      error: error.message
    });
  }
});

/**
 * @route POST /api/settlement/royalty/:musicId/distribute
 * @desc 分配版税
 * @access Private
 */
router.post('/settlement/royalty/:musicId/distribute', [
  auth,
  body('revenue').notEmpty().withMessage('Revenue amount is required'),
  body('token').notEmpty().withMessage('Token address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { musicId } = req.params;
    const { revenue, token } = req.body;

    const distribution = royaltyDistributions[musicId];
    if (!distribution) {
      return res.status(404).json({
        success: false,
        message: 'Royalty distribution not found'
      });
    }

    if (!distribution.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Royalty distribution is not active'
      });
    }

    // 计算每个利益相关者的分配金额
    const recipients = distribution.stakeholders;
    const amounts = distribution.percentages.map(percentage => {
      return (BigInt(revenue) * BigInt(percentage) / BigInt(10000)).toString();
    });

    // 创建结算任务
    const newTask = {
      id: settlementTasks.length + 1,
      type: 'ROYALTY_DISTRIBUTION',
      initiator: req.user.address,
      recipients,
      amounts,
      token,
      totalAmount: revenue,
      executionTime: Date.now(),
      deadline: Date.now() + 3600000, // 1小时后过期
      status: 'PENDING',
      metadata: musicId,
      isRecurring: false,
      recurringInterval: 0,
      createdAt: Date.now()
    };

    settlementTasks.push(newTask);

    // 更新版税分配记录
    royaltyDistributions[musicId].totalRevenue = 
      (BigInt(distribution.totalRevenue) + BigInt(revenue)).toString();
    royaltyDistributions[musicId].lastDistribution = Date.now();

    res.status(201).json({
      success: true,
      message: 'Royalty distribution task created successfully',
      data: {
        taskId: newTask.id,
        distribution: royaltyDistributions[musicId],
        recipients,
        amounts
      }
    });
  } catch (error) {
    console.error('Distribute royalty error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to distribute royalty',
      error: error.message
    });
  }
});

/**
 * @route GET /api/settlement/trades
 * @desc 获取交易结算列表
 * @access Private
 */
router.get('/settlement/trades', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let filteredTrades = Object.values(tradeSettlements);

    if (status) {
      filteredTrades = filteredTrades.filter(trade => trade.status === status);
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        trades: paginatedTrades,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredTrades.length,
          pages: Math.ceil(filteredTrades.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get trade settlements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trade settlements',
      error: error.message
    });
  }
});

/**
 * @route GET /api/settlement/automation/rules
 * @desc 获取自动化规则列表
 * @access Private
 */
router.get('/settlement/automation/rules', auth, async (req, res) => {
  try {
    const userRules = automationRules.filter(rule => rule.creator === req.user.address);

    res.json({
      success: true,
      data: {
        rules: userRules,
        count: userRules.length
      }
    });
  } catch (error) {
    console.error('Get automation rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get automation rules',
      error: error.message
    });
  }
});

/**
 * @route POST /api/settlement/automation/rules
 * @desc 创建自动化规则
 * @access Private
 */
router.post('/settlement/automation/rules', [
  auth,
  body('triggerType').isIn(['ROYALTY_DISTRIBUTION', 'TRADE_SETTLEMENT', 'YIELD_DISTRIBUTION', 'LOAN_REPAYMENT', 'INSURANCE_CLAIM']),
  body('triggerCondition').isObject().withMessage('Trigger condition must be an object'),
  body('executionData').isObject().withMessage('Execution data must be an object'),
  body('gasLimit').isInt({ min: 21000, max: 500000 }).withMessage('Gas limit must be between 21000 and 500000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { triggerType, triggerCondition, executionData, gasLimit } = req.body;

    const newRule = {
      id: automationRules.length + 1,
      creator: req.user.address,
      triggerType,
      triggerCondition,
      executionData,
      gasLimit,
      gasPrice: '20000000000', // 20 Gwei
      isActive: true,
      lastExecution: 0,
      executionCount: 0,
      createdAt: Date.now()
    };

    automationRules.push(newRule);

    res.status(201).json({
      success: true,
      message: 'Automation rule created successfully',
      data: {
        rule: newRule
      }
    });
  } catch (error) {
    console.error('Create automation rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create automation rule',
      error: error.message
    });
  }
});

/**
 * @route GET /api/settlement/stats
 * @desc 获取结算统计信息
 * @access Private
 */
router.get('/settlement/stats', auth, async (req, res) => {
  try {
    const userTasks = settlementTasks.filter(task => task.initiator === req.user.address);
    
    const stats = {
      totalTasks: userTasks.length,
      pendingTasks: userTasks.filter(task => task.status === 'PENDING').length,
      completedTasks: userTasks.filter(task => task.status === 'COMPLETED').length,
      failedTasks: userTasks.filter(task => task.status === 'FAILED').length,
      totalVolume: userTasks.reduce((sum, task) => {
        if (task.status === 'COMPLETED') {
          return (BigInt(sum) + BigInt(task.totalAmount)).toString();
        }
        return sum;
      }, '0'),
      averageExecutionTime: 2.5, // 模拟平均执行时间（秒）
      successRate: userTasks.length > 0 ? 
        (userTasks.filter(task => task.status === 'COMPLETED').length / userTasks.length * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get settlement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settlement stats',
      error: error.message
    });
  }
});

module.exports = router;