const express = require('express');
const { body, validationResult } = require('express-validator');
const { ethers } = require('ethers');
const Music = require('../models/Music');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 合约配置
const CONTRACT_CONFIG = {
  MRT_TOKEN: {
    address: process.env.MRT_TOKEN_ADDRESS,
    abi: [] // 这里应该包含实际的 ABI
  },
  TREASURY: {
    address: process.env.TREASURY_ADDRESS,
    abi: []
  },
  ORACLE: {
    address: process.env.ORACLE_ADDRESS,
    abi: []
  }
};

// 获取合约实例
const getContract = (contractName, signerOrProvider) => {
  const config = CONTRACT_CONFIG[contractName];
  if (!config || !config.address) {
    throw new Error(`Contract ${contractName} not configured`);
  }
  return new ethers.Contract(config.address, config.abi, signerOrProvider);
};

// 获取提供者
const getProvider = () => {
  const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
};

// 铸造 MRT 代币
router.post('/mint-token', [
  auth,
  authorize('artist', 'admin'),
  body('musicId').isMongoId().withMessage('Invalid music ID'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('royaltyPercentage').isFloat({ min: 0, max: 100 }).withMessage('Royalty percentage must be between 0 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { musicId, amount, royaltyPercentage } = req.body;

  // 验证音乐存在且属于当前用户
  const music = await Music.findById(musicId);
  if (!music) {
    return res.status(404).json({
      success: false,
      message: 'Music not found'
    });
  }

  if (music.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (music.tokenId) {
    return res.status(400).json({
      success: false,
      message: 'Token already minted for this music'
    });
  }

  try {
    const provider = getProvider();
    
    // 这里应该使用实际的私钥或钱包连接
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0x' + '0'.repeat(64), provider);
    const contract = getContract('MRT_TOKEN', wallet);

    // 准备元数据
    const metadata = {
      title: music.title,
      artist: req.user.username,
      album: music.album || '',
      genre: music.genre,
      duration: music.duration,
      description: music.description || '',
      coverImage: music.coverImage?.url || '',
      audioFile: music.audioFile?.url || ''
    };

    // 调用合约铸造代币
    const tx = await contract.mintMRT(
      req.user.walletAddress,
      amount,
      royaltyPercentage * 100, // 转换为基点
      JSON.stringify(metadata)
    );

    // 等待交易确认
    const receipt = await tx.wait();

    // 从事件中获取 tokenId
    const mintEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'MRTMinted';
      } catch {
        return false;
      }
    });

    let tokenId;
    if (mintEvent) {
      const parsed = contract.interface.parseLog(mintEvent);
      tokenId = parsed.args.tokenId.toString();
    }

    // 更新音乐记录
    music.tokenId = tokenId;
    music.contractAddress = CONTRACT_CONFIG.MRT_TOKEN.address;
    music.mintTransactionHash = tx.hash;
    music.copyright.royaltyPercentage = royaltyPercentage;
    await music.save();

    res.json({
      success: true,
      message: 'Token minted successfully',
      data: {
        tokenId,
        transactionHash: tx.hash,
        contractAddress: CONTRACT_CONFIG.MRT_TOKEN.address,
        amount,
        royaltyPercentage
      }
    });

  } catch (error) {
    console.error('Mint token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mint token',
      error: error.message
    });
  }
}));

// 获取代币信息
router.get('/token/:tokenId', asyncHandler(async (req, res) => {
  const { tokenId } = req.params;

  try {
    const provider = getProvider();
    const contract = getContract('MRT_TOKEN', provider);

    // 获取代币信息
    const [owner, royaltyInfo, metadata] = await Promise.all([
      contract.ownerOf(tokenId),
      contract.getRoyaltyInfo(tokenId),
      contract.getTokenMetadata(tokenId)
    ]);

    // 查找对应的音乐记录
    const music = await Music.findOne({ tokenId })
      .populate('artist', 'username profile.firstName profile.lastName profile.avatar');

    res.json({
      success: true,
      data: {
        tokenId,
        owner,
        royaltyInfo: {
          recipient: royaltyInfo.recipient,
          percentage: royaltyInfo.percentage / 100 // 转换回百分比
        },
        metadata: JSON.parse(metadata),
        music
      }
    });

  } catch (error) {
    console.error('Get token info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token information',
      error: error.message
    });
  }
}));

// 转移代币
router.post('/transfer-token', [
  auth,
  body('tokenId').notEmpty().withMessage('Token ID is required'),
  body('to').custom((value) => {
    if (!ethers.isAddress(value)) {
      throw new Error('Invalid recipient address');
    }
    return true;
  })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { tokenId, to } = req.body;

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0x' + '0'.repeat(64), provider);
    const contract = getContract('MRT_TOKEN', wallet);

    // 验证当前用户是否拥有该代币
    const owner = await contract.ownerOf(tokenId);
    if (owner.toLowerCase() !== req.user.walletAddress?.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this token'
      });
    }

    // 执行转移
    const tx = await contract.transferFrom(req.user.walletAddress, to, tokenId);
    const receipt = await tx.wait();

    res.json({
      success: true,
      message: 'Token transferred successfully',
      data: {
        tokenId,
        from: req.user.walletAddress,
        to,
        transactionHash: tx.hash
      }
    });

  } catch (error) {
    console.error('Transfer token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer token',
      error: error.message
    });
  }
}));

// 分配收益
router.post('/distribute-revenue', [
  auth,
  authorize('admin'),
  body('tokenId').notEmpty().withMessage('Token ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { tokenId, amount } = req.body;

  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0x' + '0'.repeat(64), provider);
    const treasuryContract = getContract('TREASURY', wallet);

    // 将金额转换为 wei
    const amountWei = ethers.parseEther(amount.toString());

    // 分配收益
    const tx = await treasuryContract.distributeRevenue(tokenId, {
      value: amountWei
    });

    const receipt = await tx.wait();

    // 更新音乐统计
    const music = await Music.findOne({ tokenId });
    if (music) {
      music.stats.totalEarnings += amount;
      await music.save();
    }

    res.json({
      success: true,
      message: 'Revenue distributed successfully',
      data: {
        tokenId,
        amount,
        transactionHash: tx.hash
      }
    });

  } catch (error) {
    console.error('Distribute revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to distribute revenue',
      error: error.message
    });
  }
}));

// 获取用户代币余额
router.get('/balance/:address', asyncHandler(async (req, res) => {
  const { address } = req.params;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid address'
    });
  }

  try {
    const provider = getProvider();
    const contract = getContract('MRT_TOKEN', provider);

    const balance = await contract.balanceOf(address);

    res.json({
      success: true,
      data: {
        address,
        balance: balance.toString()
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
      error: error.message
    });
  }
}));

// 获取合约统计信息
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    const provider = getProvider();
    const mrtContract = getContract('MRT_TOKEN', provider);
    const treasuryContract = getContract('TREASURY', provider);

    const [totalSupply, totalHolders, treasuryBalance] = await Promise.all([
      mrtContract.totalSupply(),
      mrtContract.getTotalHolders(),
      provider.getBalance(CONTRACT_CONFIG.TREASURY.address)
    ]);

    res.json({
      success: true,
      data: {
        totalSupply: totalSupply.toString(),
        totalHolders: totalHolders.toString(),
        treasuryBalance: ethers.formatEther(treasuryBalance),
        contracts: {
          mrtToken: CONTRACT_CONFIG.MRT_TOKEN.address,
          treasury: CONTRACT_CONFIG.TREASURY.address,
          oracle: CONTRACT_CONFIG.ORACLE.address
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contract statistics',
      error: error.message
    });
  }
}));

module.exports = router;