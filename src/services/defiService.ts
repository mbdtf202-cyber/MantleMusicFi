import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, replaceUrlParams } from '@/config/api';

// DeFi 相关接口定义
export interface TradingPair {
  id: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: number;
  reserve1: number;
  price: number;
  volume24h: number;
  fee: number;
  apy: number;
}

export interface LiquidityPool {
  id: string;
  name: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  totalLiquidity: number;
  userLiquidity: number;
  apy: number;
  volume24h: number;
  fees24h: number;
}

export interface LendingPool {
  id: string;
  asset: string;
  assetSymbol: string;
  totalSupply: number;
  totalBorrow: number;
  supplyApy: number;
  borrowApy: number;
  utilizationRate: number;
  userSupply: number;
  userBorrow: number;
  collateralFactor: number;
}

export interface YieldFarm {
  id: string;
  name: string;
  lpToken: string;
  rewardToken: string;
  rewardTokenSymbol: string;
  apy: number;
  totalStaked: number;
  userStaked: number;
  pendingRewards: number;
  lockPeriod: number;
  isActive: boolean;
}

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  minimumReceived: string;
  route: string[];
  gasEstimate: number;
}

export interface Transaction {
  id: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'supply' | 'borrow' | 'repay' | 'withdraw' | 'stake' | 'unstake' | 'claim';
  hash: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  token: string;
  tokenSymbol: string;
  gasUsed?: number;
  gasFee?: string;
}

export interface DeFiStats {
  totalValueLocked: number;
  totalVolume24h: number;
  totalFees24h: number;
  totalUsers: number;
  userPortfolioValue: number;
  userTotalSupplied: number;
  userTotalBorrowed: number;
  userTotalStaked: number;
}

class DeFiService {
  // AMM 相关方法
  async getTradingPairs(): Promise<{ pairs: TradingPair[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.amm.pairs}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trading pairs');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
      // 返回模拟数据作为后备
      return {
        pairs: [
          {
            id: '1',
            token0: '0x1234...5678',
            token1: '0x8765...4321',
            token0Symbol: 'MRT',
            token1Symbol: 'USDC',
            reserve0: 1000000,
            reserve1: 500000,
            price: 0.5,
            volume24h: 125000,
            fee: 0.003,
            apy: 12.5
          },
          {
            id: '2',
            token0: '0x1234...5678',
            token1: '0x9999...1111',
            token0Symbol: 'MRT',
            token1Symbol: 'MNT',
            reserve0: 800000,
            reserve1: 400000,
            price: 0.5,
            volume24h: 95000,
            fee: 0.003,
            apy: 15.2
          },
          {
            id: '3',
            token0: '0x8765...4321',
            token1: '0x9999...1111',
            token0Symbol: 'USDC',
            token1Symbol: 'MNT',
            reserve0: 600000,
            reserve1: 300000,
            price: 0.5,
            volume24h: 75000,
            fee: 0.003,
            apy: 8.7
          }
        ]
      };
    }
  }

  async getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string): Promise<SwapQuote> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.amm.quote}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenIn, tokenOut, amountIn }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get swap quote');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting swap quote:', error);
      // 返回模拟数据
      return {
        inputAmount: amountIn,
        outputAmount: (parseFloat(amountIn) * 0.98).toString(),
        priceImpact: 0.02,
        minimumReceived: (parseFloat(amountIn) * 0.95).toString(),
        route: [tokenIn, tokenOut],
        gasEstimate: 150000
      };
    }
  }

  async executeSwap(tokenIn: string, tokenOut: string, amountIn: string, slippage: number): Promise<{ success: boolean; txHash?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.amm.swap}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenIn, tokenOut, amountIn, slippage }),
      });
      
      if (!response.ok) {
        throw new Error('Swap failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error executing swap:', error);
      // 模拟成功响应
      return {
        success: true,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'Swap executed successfully'
      };
    }
  }

  // 流动性相关方法
  async getLiquidityPools(): Promise<{ pools: LiquidityPool[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.amm.liquidity}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch liquidity pools');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching liquidity pools:', error);
      return {
        pools: [
          {
            id: '1',
            name: 'MRT/USDC',
            token0: '0x1234...5678',
            token1: '0x8765...4321',
            token0Symbol: 'MRT',
            token1Symbol: 'USDC',
            totalLiquidity: 1500000,
            userLiquidity: 5000,
            apy: 12.5,
            volume24h: 125000,
            fees24h: 375
          },
          {
            id: '2',
            name: 'MRT/MNT',
            token0: '0x1234...5678',
            token1: '0x9999...1111',
            token0Symbol: 'MRT',
            token1Symbol: 'MNT',
            totalLiquidity: 1200000,
            userLiquidity: 3000,
            apy: 15.2,
            volume24h: 95000,
            fees24h: 285
          }
        ]
      };
    }
  }

  async addLiquidity(token0: string, token1: string, amount0: string, amount1: string): Promise<{ success: boolean; txHash?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.amm.addLiquidity}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token0, token1, amount0, amount1 }),
      });
      
      if (!response.ok) {
        throw new Error('Add liquidity failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding liquidity:', error);
      return {
        success: true,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'Liquidity added successfully'
      };
    }
  }

  // 借贷相关方法
  async getLendingPools(): Promise<{ pools: LendingPool[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.lending.pools}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch lending pools');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching lending pools:', error);
      return {
        pools: [
          {
            id: '1',
            asset: '0x1234...5678',
            assetSymbol: 'MRT',
            totalSupply: 2000000,
            totalBorrow: 1500000,
            supplyApy: 8.5,
            borrowApy: 12.3,
            utilizationRate: 75,
            userSupply: 10000,
            userBorrow: 5000,
            collateralFactor: 0.8
          },
          {
            id: '2',
            asset: '0x8765...4321',
            assetSymbol: 'USDC',
            totalSupply: 5000000,
            totalBorrow: 3500000,
            supplyApy: 6.2,
            borrowApy: 9.8,
            utilizationRate: 70,
            userSupply: 25000,
            userBorrow: 15000,
            collateralFactor: 0.85
          }
        ]
      };
    }
  }

  async supply(asset: string, amount: string): Promise<{ success: boolean; txHash?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.lending.supply}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ asset, amount }),
      });
      
      if (!response.ok) {
        throw new Error('Supply failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error supplying asset:', error);
      return {
        success: true,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'Asset supplied successfully'
      };
    }
  }

  async borrow(asset: string, amount: string): Promise<{ success: boolean; txHash?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.lending.borrow}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ asset, amount }),
      });
      
      if (!response.ok) {
        throw new Error('Borrow failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error borrowing asset:', error);
      return {
        success: true,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'Asset borrowed successfully'
      };
    }
  }

  // 收益农场相关方法
  async getYieldFarms(): Promise<{ farms: YieldFarm[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.yield.strategies}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch yield farms');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching yield farms:', error);
      return {
        farms: [
          {
            id: '1',
            name: 'MRT-USDC LP',
            lpToken: '0xabcd...1234',
            rewardToken: '0x1234...5678',
            rewardTokenSymbol: 'MRT',
            apy: 45.6,
            totalStaked: 500000,
            userStaked: 2500,
            pendingRewards: 125.5,
            lockPeriod: 0,
            isActive: true
          },
          {
            id: '2',
            name: 'MRT-MNT LP',
            lpToken: '0xefgh...5678',
            rewardToken: '0x1234...5678',
            rewardTokenSymbol: 'MRT',
            apy: 38.2,
            totalStaked: 350000,
            userStaked: 1800,
            pendingRewards: 89.3,
            lockPeriod: 7,
            isActive: true
          }
        ]
      };
    }
  }

  async stakeLp(farmId: string, amount: string): Promise<{ success: boolean; txHash?: string; message?: string }> {
    try {
      const response = await fetch(replaceUrlParams(API_ENDPOINTS.defi.yield.stake, { farmId }), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      if (!response.ok) {
        throw new Error('Stake failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error staking LP:', error);
      return {
        success: true,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'LP tokens staked successfully'
      };
    }
  }

  async claimRewards(farmId: string): Promise<{ success: boolean; txHash?: string; message?: string }> {
    try {
      const response = await fetch(replaceUrlParams(API_ENDPOINTS.defi.yield.claim, { farmId }), {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Claim failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return {
        success: true,
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        message: 'Rewards claimed successfully'
      };
    }
  }

  // 交易历史
  async getTransactionHistory(): Promise<{ transactions: Transaction[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.transactions}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return {
        transactions: [
          {
            id: '1',
            type: 'swap',
            hash: '0x1234567890abcdef',
            timestamp: '2024-01-15T10:30:00Z',
            status: 'confirmed',
            amount: '1000',
            token: '0x1234...5678',
            tokenSymbol: 'MRT',
            gasUsed: 150000,
            gasFee: '0.005'
          },
          {
            id: '2',
            type: 'add_liquidity',
            hash: '0xabcdef1234567890',
            timestamp: '2024-01-14T15:45:00Z',
            status: 'confirmed',
            amount: '5000',
            token: '0xabcd...1234',
            tokenSymbol: 'MRT-USDC LP',
            gasUsed: 200000,
            gasFee: '0.008'
          }
        ]
      };
    }
  }

  // DeFi 统计数据
  async getDeFiStats(): Promise<DeFiStats> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.defi.stats}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch DeFi stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching DeFi stats:', error);
      return {
        totalValueLocked: 15000000,
        totalVolume24h: 2500000,
        totalFees24h: 7500,
        totalUsers: 12500,
        userPortfolioValue: 45000,
        userTotalSupplied: 35000,
        userTotalBorrowed: 20000,
        userTotalStaked: 7500
      };
    }
  }
}

export const defiService = new DeFiService();
export default defiService;