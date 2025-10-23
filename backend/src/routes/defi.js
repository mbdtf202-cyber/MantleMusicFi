const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// 限流中间件
const defiLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: 'Too many DeFi requests from this IP'
});

// 模拟区块链连接
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

// AMM相关API
// 获取所有交易对
router.get('/amm/pairs', defiLimit, async (req, res) => {
  try {
    // 模拟数据
    const pairs = [
      {
        id: '1',
        token0: {
          address: '0x1234...5678',
          symbol: 'MRT',
          name: 'MantleMusic Token',
          decimals: 18
        },
        token1: {
          address: '0x8765...4321',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        },
        reserve0: '1000000000000000000000', // 1000 MRT
        reserve1: '50000000', // 50 USDC
        totalSupply: '223606797749978969', // LP token总供应量
        price: '0.05', // MRT/USDC价格
        volume24h: '125000000000000000000', // 24小时交易量
        fees24h: '375000000000000000', // 24小时手续费
        apr: '15.2', // 年化收益率
        tvl: '100000000' // 总锁定价值(USD)
      },
      {
        id: '2',
        token0: {
          address: '0x1234...5678',
          symbol: 'MRT',
          name: 'MantleMusic Token',
          decimals: 18
        },
        token1: {
          address: '0x9876...1234',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18
        },
        reserve0: '2000000000000000000000', // 2000 MRT
        reserve1: '25000000000000000000', // 25 ETH
        totalSupply: '316227766016837933', // LP token总供应量
        price: '0.0125', // MRT/ETH价格
        volume24h: '200000000000000000000', // 24小时交易量
        fees24h: '600000000000000000', // 24小时手续费
        apr: '18.5', // 年化收益率
        tvl: '150000000' // 总锁定价值(USD)
      }
    ];

    res.json({
      success: true,
      data: pairs,
      total: pairs.length
    });
  } catch (error) {
    console.error('Get AMM pairs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AMM pairs',
      error: error.message
    });
  }
});

// 获取特定交易对信息
router.get('/amm/pairs/:pairId', defiLimit, async (req, res) => {
  try {
    const { pairId } = req.params;
    
    // 模拟获取交易对详细信息
    const pairInfo = {
      id: pairId,
      token0: {
        address: '0x1234...5678',
        symbol: 'MRT',
        name: 'MantleMusic Token',
        decimals: 18
      },
      token1: {
        address: '0x8765...4321',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      },
      reserve0: '1000000000000000000000',
      reserve1: '50000000',
      totalSupply: '223606797749978969',
      price: '0.05',
      priceHistory: [
        { timestamp: Date.now() - 86400000, price: '0.048' },
        { timestamp: Date.now() - 43200000, price: '0.052' },
        { timestamp: Date.now(), price: '0.05' }
      ],
      volume24h: '125000000000000000000',
      fees24h: '375000000000000000',
      apr: '15.2',
      tvl: '100000000',
      liquidityProviders: 156,
      transactions24h: 1250
    };

    res.json({
      success: true,
      data: pairInfo
    });
  } catch (error) {
    console.error('Get pair info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pair info',
      error: error.message
    });
  }
});

// 计算交换价格
router.post('/amm/quote', defiLimit, async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn } = req.body;
    
    // 模拟价格计算（恒定乘积公式）
    const reserveIn = ethers.parseEther('1000'); // 1000 tokens
    const reserveOut = ethers.parseEther('50'); // 50 tokens
    const amountInBN = ethers.parseEther(amountIn.toString());
    
    // (reserveIn * reserveOut) = (reserveIn + amountIn) * (reserveOut - amountOut)
    // amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
    const amountOut = (amountInBN * reserveOut) / (reserveIn + amountInBN);
    
    const priceImpact = (amountInBN * BigInt(10000)) / (reserveIn + amountInBN);
    const fee = amountInBN * BigInt(30) / BigInt(10000); // 0.3% fee
    
    res.json({
      success: true,
      data: {
        amountIn: amountIn.toString(),
        amountOut: ethers.formatEther(amountOut),
        priceImpact: Number(priceImpact) / 100, // 转换为百分比
        fee: ethers.formatEther(fee),
        route: [tokenIn, tokenOut],
        minimumReceived: ethers.formatEther(amountOut * BigInt(995) / BigInt(1000)) // 0.5% slippage
      }
    });
  } catch (error) {
    console.error('Quote calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate quote',
      error: error.message
    });
  }
});

// 添加流动性
router.post('/amm/add-liquidity', auth, defiLimit, async (req, res) => {
  try {
    const { pairId, amount0, amount1, slippage = 0.5 } = req.body;
    const userId = req.user.id;
    
    // 模拟添加流动性交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    const lpTokens = Math.sqrt(parseFloat(amount0) * parseFloat(amount1));
    
    // 这里应该调用智能合约
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xAMM_CONTRACT_ADDRESS',
      value: '0',
      gasUsed: '150000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'add_liquidity',
      details: {
        pairId,
        amount0,
        amount1,
        lpTokensReceived: lpTokens.toString(),
        slippage
      }
    };

    res.json({
      success: true,
      message: 'Liquidity addition initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Add liquidity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add liquidity',
      error: error.message
    });
  }
});

// 移除流动性
router.post('/amm/remove-liquidity', auth, defiLimit, async (req, res) => {
  try {
    const { pairId, lpTokenAmount, slippage = 0.5 } = req.body;
    const userId = req.user.id;
    
    // 模拟移除流动性交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xAMM_CONTRACT_ADDRESS',
      value: '0',
      gasUsed: '120000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'remove_liquidity',
      details: {
        pairId,
        lpTokenAmount,
        estimatedAmount0: (parseFloat(lpTokenAmount) * 0.5).toString(),
        estimatedAmount1: (parseFloat(lpTokenAmount) * 25).toString(),
        slippage
      }
    };

    res.json({
      success: true,
      message: 'Liquidity removal initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Remove liquidity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove liquidity',
      error: error.message
    });
  }
});

// 执行代币交换
router.post('/amm/swap', auth, defiLimit, async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, amountOutMin, slippage = 0.5 } = req.body;
    const userId = req.user.id;
    
    // 模拟交换交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xAMM_CONTRACT_ADDRESS',
      value: tokenIn === 'ETH' ? amountIn : '0',
      gasUsed: '100000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'swap',
      details: {
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMin,
        estimatedAmountOut: (parseFloat(amountIn) * 0.95).toString(), // 模拟输出
        slippage,
        route: [tokenIn, tokenOut]
      }
    };

    res.json({
      success: true,
      message: 'Swap initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute swap',
      error: error.message
    });
  }
});

// Lending Pool相关API
// 获取借贷池信息
router.get('/lending/pools', defiLimit, async (req, res) => {
  try {
    const pools = [
      {
        asset: 'MRT',
        address: '0x1234...5678',
        totalSupply: '5000000000000000000000', // 5000 MRT
        totalBorrow: '2000000000000000000000', // 2000 MRT
        supplyAPY: '8.5',
        borrowAPY: '12.3',
        utilizationRate: '40.0',
        liquidationThreshold: '75',
        liquidationPenalty: '10',
        reserveFactor: '15',
        collateralFactor: '70'
      },
      {
        asset: 'USDC',
        address: '0x8765...4321',
        totalSupply: '1000000000000', // 1M USDC
        totalBorrow: '600000000000', // 600K USDC
        supplyAPY: '5.2',
        borrowAPY: '8.7',
        utilizationRate: '60.0',
        liquidationThreshold: '85',
        liquidationPenalty: '8',
        reserveFactor: '10',
        collateralFactor: '80'
      }
    ];

    res.json({
      success: true,
      data: pools
    });
  } catch (error) {
    console.error('Get lending pools error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lending pools',
      error: error.message
    });
  }
});

// 获取用户借贷信息
router.get('/lending/account', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 模拟用户借贷数据
    const accountData = {
      totalSupplied: '15000000000000000000000', // 15000 USD
      totalBorrowed: '8000000000000000000000', // 8000 USD
      availableToBorrow: '3500000000000000000000', // 3500 USD
      healthFactor: '1.85',
      liquidationThreshold: '12000000000000000000000', // 12000 USD
      supplies: [
        {
          asset: 'MRT',
          amount: '200000000000000000000', // 200 MRT
          aTokenBalance: '205000000000000000000', // 205 aMRT
          currentAPY: '8.5',
          valueUSD: '10000000000000000000000' // 10000 USD
        },
        {
          asset: 'USDC',
          amount: '5000000000', // 5000 USDC
          aTokenBalance: '5125000000', // 5125 aUSDC
          currentAPY: '5.2',
          valueUSD: '5000000000000000000000' // 5000 USD
        }
      ],
      borrows: [
        {
          asset: 'USDC',
          amount: '8000000000', // 8000 USDC
          currentAPY: '8.7',
          valueUSD: '8000000000000000000000' // 8000 USD
        }
      ]
    };

    res.json({
      success: true,
      data: accountData
    });
  } catch (error) {
    console.error('Get lending account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lending account',
      error: error.message
    });
  }
});

// 存款
router.post('/lending/supply', auth, defiLimit, async (req, res) => {
  try {
    const { asset, amount } = req.body;
    const userId = req.user.id;
    
    // 模拟存款交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xLENDING_POOL_ADDRESS',
      value: asset === 'ETH' ? amount : '0',
      gasUsed: '80000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'supply',
      details: {
        asset,
        amount,
        aTokensReceived: (parseFloat(amount) * 1.0).toString()
      }
    };

    res.json({
      success: true,
      message: 'Supply initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Supply error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to supply',
      error: error.message
    });
  }
});

// 取款
router.post('/lending/withdraw', auth, defiLimit, async (req, res) => {
  try {
    const { asset, amount } = req.body;
    const userId = req.user.id;
    
    // 模拟取款交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xLENDING_POOL_ADDRESS',
      value: '0',
      gasUsed: '75000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'withdraw',
      details: {
        asset,
        amount,
        aTokensBurned: (parseFloat(amount) * 1.0).toString()
      }
    };

    res.json({
      success: true,
      message: 'Withdrawal initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw',
      error: error.message
    });
  }
});

// 借款
router.post('/lending/borrow', auth, defiLimit, async (req, res) => {
  try {
    const { asset, amount, interestRateMode = 'variable' } = req.body;
    const userId = req.user.id;
    
    // 模拟借款交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xLENDING_POOL_ADDRESS',
      value: '0',
      gasUsed: '90000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'borrow',
      details: {
        asset,
        amount,
        interestRateMode,
        currentAPY: '8.7'
      }
    };

    res.json({
      success: true,
      message: 'Borrow initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Borrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to borrow',
      error: error.message
    });
  }
});

// 还款
router.post('/lending/repay', auth, defiLimit, async (req, res) => {
  try {
    const { asset, amount } = req.body;
    const userId = req.user.id;
    
    // 模拟还款交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xLENDING_POOL_ADDRESS',
      value: asset === 'ETH' ? amount : '0',
      gasUsed: '70000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'repay',
      details: {
        asset,
        amount
      }
    };

    res.json({
      success: true,
      message: 'Repayment initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Repay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to repay',
      error: error.message
    });
  }
});

// Yield Aggregator相关API
// 获取收益策略
router.get('/yield/strategies', defiLimit, async (req, res) => {
  try {
    const strategies = [
      {
        id: '1',
        name: 'MRT-USDC LP Farming',
        description: 'Provide liquidity to MRT-USDC pair and farm rewards',
        asset: 'MRT-USDC LP',
        apy: '25.8',
        tvl: '2500000000000000000000000', // 2.5M USD
        riskLevel: 'Medium',
        protocol: 'MantleMusic AMM',
        autoCompound: true,
        fees: {
          deposit: '0',
          withdrawal: '0.1',
          performance: '10'
        }
      },
      {
        id: '2',
        name: 'USDC Lending Optimization',
        description: 'Automatically optimize USDC lending across multiple protocols',
        asset: 'USDC',
        apy: '12.4',
        tvl: '5000000000000000000000000', // 5M USD
        riskLevel: 'Low',
        protocol: 'Multi-Protocol',
        autoCompound: true,
        fees: {
          deposit: '0',
          withdrawal: '0',
          performance: '5'
        }
      },
      {
        id: '3',
        name: 'MRT Staking Plus',
        description: 'Stake MRT tokens with additional yield farming rewards',
        asset: 'MRT',
        apy: '18.6',
        tvl: '10000000000000000000000000', // 10M USD
        riskLevel: 'Low',
        protocol: 'MantleMusic Staking',
        autoCompound: true,
        fees: {
          deposit: '0',
          withdrawal: '0.05',
          performance: '8'
        }
      }
    ];

    res.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    console.error('Get yield strategies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get yield strategies',
      error: error.message
    });
  }
});

// 获取用户收益信息
router.get('/yield/positions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 模拟用户收益仓位
    const positions = [
      {
        strategyId: '1',
        strategyName: 'MRT-USDC LP Farming',
        deposited: '1000000000000000000000', // 1000 USD
        currentValue: '1125000000000000000000', // 1125 USD
        earned: '125000000000000000000', // 125 USD
        apy: '25.8',
        depositDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastHarvest: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        pendingRewards: '15000000000000000000' // 15 USD
      },
      {
        strategyId: '3',
        strategyName: 'MRT Staking Plus',
        deposited: '2000000000000000000000', // 2000 USD
        currentValue: '2180000000000000000000', // 2180 USD
        earned: '180000000000000000000', // 180 USD
        apy: '18.6',
        depositDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastHarvest: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        pendingRewards: '25000000000000000000' // 25 USD
      }
    ];

    const summary = {
      totalDeposited: '3000000000000000000000', // 3000 USD
      totalValue: '3305000000000000000000', // 3305 USD
      totalEarned: '305000000000000000000', // 305 USD
      totalPendingRewards: '40000000000000000000', // 40 USD
      averageAPY: '21.5'
    };

    res.json({
      success: true,
      data: {
        positions,
        summary
      }
    });
  } catch (error) {
    console.error('Get yield positions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get yield positions',
      error: error.message
    });
  }
});

// 存入收益策略
router.post('/yield/deposit', auth, defiLimit, async (req, res) => {
  try {
    const { strategyId, amount } = req.body;
    const userId = req.user.id;
    
    // 模拟存入交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xYIELD_AGGREGATOR_ADDRESS',
      value: '0',
      gasUsed: '120000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'yield_deposit',
      details: {
        strategyId,
        amount,
        sharesReceived: (parseFloat(amount) * 0.98).toString() // 扣除费用
      }
    };

    res.json({
      success: true,
      message: 'Yield deposit initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Yield deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deposit to yield strategy',
      error: error.message
    });
  }
});

// 从收益策略提取
router.post('/yield/withdraw', auth, defiLimit, async (req, res) => {
  try {
    const { strategyId, amount } = req.body;
    const userId = req.user.id;
    
    // 模拟提取交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xYIELD_AGGREGATOR_ADDRESS',
      value: '0',
      gasUsed: '100000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'yield_withdraw',
      details: {
        strategyId,
        amount,
        sharesBurned: (parseFloat(amount) * 1.02).toString(),
        withdrawalFee: (parseFloat(amount) * 0.001).toString()
      }
    };

    res.json({
      success: true,
      message: 'Yield withdrawal initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Yield withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw from yield strategy',
      error: error.message
    });
  }
});

// 收获奖励
router.post('/yield/harvest', auth, defiLimit, async (req, res) => {
  try {
    const { strategyId } = req.body;
    const userId = req.user.id;
    
    // 模拟收获交易
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    const transaction = {
      hash: txHash,
      from: req.user.walletAddress,
      to: '0xYIELD_AGGREGATOR_ADDRESS',
      value: '0',
      gasUsed: '80000',
      gasPrice: '20000000000',
      status: 'pending',
      timestamp: new Date(),
      type: 'yield_harvest',
      details: {
        strategyId,
        rewardsHarvested: '25000000000000000000', // 25 USD
        performanceFee: '2500000000000000000' // 2.5 USD (10%)
      }
    };

    res.json({
      success: true,
      message: 'Harvest initiated',
      data: transaction
    });
  } catch (error) {
    console.error('Harvest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to harvest rewards',
      error: error.message
    });
  }
});

// 获取交易历史
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const userId = req.user.id;
    
    // 模拟交易历史
    const transactions = [
      {
        hash: '0x1234567890abcdef',
        type: 'swap',
        status: 'confirmed',
        timestamp: new Date(Date.now() - 3600000),
        details: {
          tokenIn: 'USDC',
          tokenOut: 'MRT',
          amountIn: '100',
          amountOut: '2000'
        }
      },
      {
        hash: '0xabcdef1234567890',
        type: 'add_liquidity',
        status: 'confirmed',
        timestamp: new Date(Date.now() - 7200000),
        details: {
          pairId: '1',
          amount0: '1000',
          amount1: '50',
          lpTokensReceived: '223.6'
        }
      }
    ];

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transactions.length,
        pages: Math.ceil(transactions.length / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
});

module.exports = router;