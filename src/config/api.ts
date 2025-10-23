// API配置
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API端点
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    REFRESH: '/api/auth/refresh'
  },
  
  // 艺术家相关
  ARTIST: {
    DASHBOARD: '/api/artist/dashboard',
    UPLOAD: '/api/artist/upload',
    TRACKS: '/api/artist/tracks',
    TOKENIZE: '/api/artist/:musicId/tokenize',
    REVENUE_REPORT: '/api/artist/revenue/report',
    DISTRIBUTE_REVENUE: '/api/artist/:musicId/distribute-revenue',
    TOKENS: '/api/artist/tokens',
    UPDATE_TOKEN_PRICE: '/api/artist/tokens/:tokenId/price'
  },
  
  // DeFi相关
  DEFI: {
    AMM_PAIRS: '/api/defi/amm/pairs',
    AMM_QUOTE: '/api/defi/amm/quote',
    AMM_SWAP: '/api/defi/amm/swap',
    AMM_ADD_LIQUIDITY: '/api/defi/amm/add-liquidity',
    AMM_REMOVE_LIQUIDITY: '/api/defi/amm/remove-liquidity',
    LENDING_POOLS: '/api/defi/lending/pools',
    LENDING_ACCOUNT: '/api/defi/lending/account',
    LENDING_SUPPLY: '/api/defi/lending/supply',
    LENDING_WITHDRAW: '/api/defi/lending/withdraw',
    LENDING_BORROW: '/api/defi/lending/borrow',
    LENDING_REPAY: '/api/defi/lending/repay',
    YIELD_STRATEGIES: '/api/defi/yield/strategies',
    YIELD_POSITIONS: '/api/defi/yield/positions',
    YIELD_DEPOSIT: '/api/defi/yield/deposit',
    YIELD_WITHDRAW: '/api/defi/yield/withdraw',
    YIELD_HARVEST: '/api/defi/yield/harvest',
    TRANSACTIONS: '/api/defi/transactions'
  },
  
  // 治理相关
  GOVERNANCE: {
    PROPOSALS: '/api/governance/proposals',
    PROPOSAL_DETAIL: '/api/governance/proposals/:id',
    CREATE_PROPOSAL: '/api/governance/proposals',
    VOTE: '/api/governance/proposals/:id/vote',
    EXECUTE_PROPOSAL: '/api/governance/proposals/:id/execute',
    CANCEL_PROPOSAL: '/api/governance/proposals/:id/cancel',
    DELEGATIONS: '/api/governance/delegations',
    DELEGATE: '/api/governance/delegate',
    REVOKE_DELEGATION: '/api/governance/revoke-delegation/:id',
    STATS: '/api/governance/stats',
    USER_STATS: '/api/governance/user/:address/stats',
    VOTING_POWER: '/api/governance/voting-power/:address'
  },
  
  // 分析相关
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard/:userId',
    OVERVIEW: '/api/analytics/overview',
    REVENUE: '/api/analytics/revenue',
    USER_GROWTH: '/api/analytics/user-growth',
    TOP_ARTISTS: '/api/analytics/top-artists',
    GENRE_DISTRIBUTION: '/api/analytics/genre-distribution',
    DEFI_METRICS: '/api/analytics/defi-metrics',
  },
  
  // 隐私相关
  PRIVACY: {
    ZK_KYC: '/api/privacy/zk-kyc',
    ZK_KYC_STATUS: '/api/privacy/zk-kyc/status/:address',
    ZK_KYC_SUBMIT: '/api/privacy/zk-kyc/submit',
    SBT: '/api/privacy/sbt',
    SBT_USER: '/api/privacy/sbt/user/:address',
    SBT_ISSUE: '/api/privacy/sbt/issue',
    COMPLIANCE: '/api/privacy/compliance',
    COMPLIANCE_CHECK: '/api/privacy/compliance/check/:address',
  },
  
  // 用户相关
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    PREFERENCES: '/api/user/preferences',
    ACTIVITY: '/api/user/activity',
    NOTIFICATIONS: '/api/user/notifications'
  },
  
  // 音乐相关
  MUSIC: {
    SEARCH: '/api/music/search',
    TRENDING: '/api/music/trending',
    RECOMMENDATIONS: '/api/music/recommendations',
    DETAIL: '/api/music/:id',
    PLAY: '/api/music/:id/play',
    LIKE: '/api/music/:id/like',
    PLAYLIST: '/api/music/playlist'
  },
  
  // 市场相关
  MARKET: {
    TOKENS: '/api/market/tokens',
    TOKEN_DETAIL: '/api/market/tokens/:id',
    TRADING_PAIRS: '/api/market/pairs',
    ORDER_BOOK: '/api/market/orderbook/:pair',
    TRADE_HISTORY: '/api/market/history/:pair',
    USER_ORDERS: '/api/market/orders',
    CREATE_ORDER: '/api/market/orders',
    CANCEL_ORDER: '/api/market/orders/:id'
  },

  // 投资者仪表板相关
  INVESTOR: {
    DASHBOARD: '/api/analytics/dashboard/:userId',
    PORTFOLIO: '/api/analytics/portfolio/:userId',
    PORTFOLIO_HISTORY: '/api/analytics/portfolio/:userId/performance',
    PORTFOLIO_PERFORMANCE: '/api/market/portfolio/:userId/performance',
    MARKET_DATA: '/api/market/tokens',
    DEFI_METRICS: '/api/analytics/defi/metrics',
    INVEST: '/api/market/orders',
    SELL: '/api/market/orders'
  }
};

// HTTP请求配置
export const REQUEST_CONFIG = {
  timeout: 30000, // 30秒超时
  retries: 3, // 重试次数
  retryDelay: 1000 // 重试延迟(毫秒)
};

// 错误代码映射
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

// 成功状态码
export const SUCCESS_CODES = [200, 201, 202, 204];

// 请求头配置
export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// URL参数替换工具函数
export const replaceUrlParams = (url: string, params: Record<string, string | number>) => {
  let result = url;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value));
  });
  return result;
};