const { body, param, query } = require('express-validator');

// 用户注册验证
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
  
  body('walletAddress')
    .optional()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('请输入有效的钱包地址'),
];

// 用户登录验证
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
];

// 钱包登录验证
const validateWalletLogin = [
  body('walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('请输入有效的钱包地址'),
  
  body('signature')
    .notEmpty()
    .withMessage('签名不能为空'),
  
  body('message')
    .notEmpty()
    .withMessage('消息不能为空'),
];

// 音乐创建验证
const validateCreateMusic = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('音乐标题长度必须在1-200个字符之间'),
  
  body('artist')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('艺术家名称长度必须在1-100个字符之间'),
  
  body('album')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('专辑名称长度不能超过100个字符'),
  
  body('genre')
    .isIn(['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'folk', 'blues', 'reggae', 'other'])
    .withMessage('请选择有效的音乐流派'),
  
  body('duration')
    .isInt({ min: 1 })
    .withMessage('音乐时长必须是正整数（秒）'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('描述长度不能超过1000个字符'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('每个标签长度必须在1-50个字符之间'),
];

// 音乐更新验证
const validateUpdateMusic = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('音乐标题长度必须在1-200个字符之间'),
  
  body('artist')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('艺术家名称长度必须在1-100个字符之间'),
  
  body('album')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('专辑名称长度不能超过100个字符'),
  
  body('genre')
    .optional()
    .isIn(['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'folk', 'blues', 'reggae', 'other'])
    .withMessage('请选择有效的音乐流派'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('描述长度不能超过1000个字符'),
];

// 用户资料更新验证
const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('个人简介长度不能超过500个字符'),
  
  body('profile.website')
    .optional()
    .isURL()
    .withMessage('请输入有效的网站URL'),
  
  body('profile.socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('请输入有效的Twitter链接'),
  
  body('profile.socialLinks.instagram')
    .optional()
    .isURL()
    .withMessage('请输入有效的Instagram链接'),
];

// 合约交互验证
const validateMintToken = [
  body('to')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('请输入有效的接收地址'),
  
  body('amount')
    .isNumeric()
    .withMessage('代币数量必须是数字'),
  
  body('metadata')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('元数据长度不能超过500个字符'),
];

const validateTransferToken = [
  body('to')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('请输入有效的接收地址'),
  
  body('amount')
    .isNumeric()
    .withMessage('代币数量必须是数字'),
];

// 分页验证
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
];

// ObjectId验证
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage('无效的ID格式'),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateWalletLogin,
  validateCreateMusic,
  validateUpdateMusic,
  validateUpdateProfile,
  validateMintToken,
  validateTransferToken,
  validatePagination,
  validateObjectId,
};