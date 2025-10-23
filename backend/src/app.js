const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const musicRoutes = require('./routes/music');
const contractRoutes = require('./routes/contract');
const userRoutes = require('./routes/user');
const analyticsRoutes = require('./routes/analytics');

const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('../config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 连接数据库
connectDB();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 15 分钟内最多 100 个请求
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// 基础中间件
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/user', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/artist', require('./routes/artist'));
app.use('/api/defi', require('./routes/defi'));
app.use('/api/oracle', require('./routes/oracle'));
app.use('/api/privacy', require('./routes/privacy'));
app.use('/api/governance', require('./routes/governance'));

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;