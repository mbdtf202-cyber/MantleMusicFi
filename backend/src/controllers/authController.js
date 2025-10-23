const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { ethers } = require('ethers');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// 生成JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// 用户注册
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array(),
    });
  }

  const { username, email, password, walletAddress, role } = req.body;

  // 检查用户是否已存在
  const existingUser = await User.findOne({
    $or: [{ email }, { username }, { walletAddress }],
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: '用户名、邮箱或钱包地址已存在',
    });
  }

  // 创建新用户
  const user = new User({
    username,
    email,
    password,
    walletAddress,
    role: role || 'user', // 默认为普通用户
  });

  await user.save();

  // 生成token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
      },
      token,
    },
  });
});

// 用户登录
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // 查找用户
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '邮箱或密码错误',
    });
  }

  // 验证密码
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: '邮箱或密码错误',
    });
  }

  // 检查用户是否被禁用
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: '账户已被禁用',
    });
  }

  // 更新登录信息
  await user.updateLoginInfo();

  // 生成token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
      },
      token,
    },
  });
});

// 钱包登录
const walletLogin = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array(),
    });
  }

  const { walletAddress, signature, message } = req.body;

  try {
    // 验证签名
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: '签名验证失败',
      });
    }

    // 查找或创建用户
    let user = await User.findOne({ walletAddress });
    
    if (!user) {
      // 创建新用户
      user = new User({
        username: `user_${walletAddress.slice(-8)}`,
        walletAddress,
        isVerified: true,
      });
      await user.save();
    }

    // 检查用户是否被禁用
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用',
      });
    }

    // 更新登录信息
    await user.updateLoginInfo();

    // 生成token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '钱包登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '签名验证失败',
    });
  }
});

// 获取当前用户信息
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        profile: user.profile,
        isVerified: user.isVerified,
        tokenBalance: user.tokenBalance,
        totalEarnings: user.totalEarnings,
      },
    },
  });
});

// 刷新Token
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: '用户不存在或已被禁用',
    });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Token刷新成功',
    data: { token },
  });
});

// 登出
const logout = asyncHandler(async (req, res) => {
  // 在实际应用中，可以将token加入黑名单
  res.json({
    success: true,
    message: '登出成功',
  });
});

module.exports = {
  register,
  login,
  walletLogin,
  getMe,
  refreshToken,
  logout,
};