const express = require('express');
const { auth } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateWalletLogin,
} = require('../utils/validation');
const {
  register,
  login,
  walletLogin,
  getMe,
  refreshToken,
  logout,
} = require('../controllers/authController');

const router = express.Router();

// 路由定义
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/wallet-login', validateWalletLogin, walletLogin);
router.get('/me', auth, getMe);
router.post('/refresh', auth, refreshToken);
router.post('/logout', auth, logout);

module.exports = router;