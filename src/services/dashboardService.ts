import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '@/config/api';

// URL参数替换辅助函数
function replaceUrlParams(url: string, params: Record<string, string>): string {
  let result = url;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value);
  });
  return result;
}

// 接口定义
export interface Investment {
  id: string;
  trackTitle: string;
  artist: string;
  mrtTokens: number;
  investmentAmount: number;
  currentValue: number;
  dailyReturn: number;
  totalReturn: number;
  returnPercentage: number;
  status: string;
}

export interface MarketSong {
  id: string;
  title: string;
  artist: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  genre: string;
  trending?: boolean;
}

export interface DeFiMetrics {
  totalValueLocked: number;
  stakingRewards: number;
  liquidityPools: number;
  governanceTokens: number;
}

export interface PortfolioStats {
  totalInvestment: number;
  currentValue: number;
  dailyReturn: number;
  totalReturn: number;
  returnPercentage: number;
  mrtHoldings: number;
  portfolioCount: number;
}

export interface DashboardData {
  investments: Investment[];
  marketSongs: MarketSong[];
  portfolioStats: PortfolioStats;
  defiMetrics: DeFiMetrics;
  portfolioChart: Array<{ x: string; y: number }>;
}

export interface MarketFilter {
  genre?: string;
  priceRange?: { min: number; max: number };
  sortBy?: 'price' | 'change24h' | 'volume' | 'marketCap';
  sortOrder?: 'asc' | 'desc';
}

export class DashboardService {
  private static instance: DashboardService;

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  // 获取仪表板数据
  async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      // 暂时直接返回模拟数据，跳过API调用
      console.log('Using mock dashboard data for testing');
      return this.getMockDashboardData();
      
      // TODO: 恢复API调用当认证问题解决后
      // const url = replaceUrlParams(API_ENDPOINTS.INVESTOR.DASHBOARD, { userId });
      // const response = await fetch(`${API_BASE_URL}${url}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('Dashboard data received:', data);
      // return data.data || data;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // 返回模拟数据作为后备
      return this.getMockDashboardData();
    }
  }

  // 获取投资组合数据
  async getPortfolioData(userId: string): Promise<Investment[]> {
    try {
      const response = await fetch(
        replaceUrlParams(API_ENDPOINTS.user.portfolio, { userId }),
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.investments || [];
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      return this.getMockInvestments();
    }
  }

  // 获取市场数据
  async getMarketData(filter?: MarketFilter): Promise<MarketSong[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filter?.genre) queryParams.append('genre', filter.genre);
      if (filter?.priceRange) {
        queryParams.append('minPrice', filter.priceRange.min.toString());
        queryParams.append('maxPrice', filter.priceRange.max.toString());
      }
      if (filter?.sortBy) queryParams.append('sortBy', filter.sortBy);
      if (filter?.sortOrder) queryParams.append('sortOrder', filter.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.INVESTOR.MARKET_DATA}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Market data received:', data);
      return data.data?.tokens || data.tokens || data.songs || [];
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      return this.getMockMarketSongs();
    }
  }

  // 获取DeFi指标
  async getDeFiMetrics(): Promise<DeFiMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INVESTOR.DEFI_METRICS}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('DeFi metrics received:', data);
      return data.data || data;
    } catch (error) {
      console.error('Failed to fetch DeFi metrics:', error);
      return this.getMockDeFiMetrics();
    }
  }

  // 获取投资组合历史数据
  async getPortfolioHistory(userId: string): Promise<any[]> {
    try {
      // 暂时直接返回模拟数据，跳过API调用
      console.log('Using mock portfolio history data for testing');
      return this.getMockPortfolioHistory();
      
      // TODO: 恢复API调用当认证问题解决后
      // const url = replaceUrlParams(API_ENDPOINTS.INVESTOR.PORTFOLIO_HISTORY, { userId });
      // const response = await fetch(`${API_BASE_URL}${url}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('Portfolio history received:', data);
      // return data.data?.portfolioHistory || data.portfolioHistory || [];
    } catch (error) {
      console.error('Failed to fetch portfolio history:', error);
      // 返回模拟数据作为后备
      return this.getMockPortfolioHistory();
    }
  }

  // 投资音乐资产
  async investInTrack(trackId: string, amount: number): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const response = await fetch(API_ENDPOINTS.music.invest, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          trackId,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, transactionId: data.transactionId };
    } catch (error) {
      console.error('Failed to invest in track:', error);
      return { success: false, error: 'Investment failed. Please try again.' };
    }
  }

  // 出售投资
  async sellInvestment(investmentId: string, amount: number): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const response = await fetch(
        replaceUrlParams(API_ENDPOINTS.user.sellInvestment, { investmentId }),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ amount }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, transactionId: data.transactionId };
    } catch (error) {
      console.error('Failed to sell investment:', error);
      return { success: false, error: 'Sale failed. Please try again.' };
    }
  }

  // 模拟数据方法
  private getMockDashboardData(): DashboardData {
    return {
      investments: this.getMockInvestments(),
      marketSongs: this.getMockMarketSongs(),
      portfolioStats: this.getMockPortfolioStats(),
      defiMetrics: this.getMockDeFiMetrics(),
      portfolioChart: this.getMockPortfolioHistory(),
    };
  }

  private getMockInvestments(): Investment[] {
    return [
      {
        id: '1',
        trackTitle: 'Midnight Dreams',
        artist: 'Luna Echo',
        mrtTokens: 300,
        investmentAmount: 1.5,
        currentValue: 2.1,
        dailyReturn: 0.05,
        totalReturn: 0.6,
        returnPercentage: 40,
        status: 'active'
      },
      {
        id: '2',
        trackTitle: 'Ocean Waves',
        artist: 'Aqua Sound',
        mrtTokens: 160,
        investmentAmount: 0.8,
        currentValue: 0.95,
        dailyReturn: 0.02,
        totalReturn: 0.15,
        returnPercentage: 18.75,
        status: 'active'
      },
      {
        id: '3',
        trackTitle: 'City Lights',
        artist: 'Urban Pulse',
        mrtTokens: 400,
        investmentAmount: 2.0,
        currentValue: 1.7,
        dailyReturn: -0.03,
        totalReturn: -0.3,
        returnPercentage: -15,
        status: 'active'
      }
    ];
  }

  private getMockMarketSongs(): MarketSong[] {
    return [
      {
        id: '1',
        title: 'Stellar Journey',
        artist: 'Cosmic Beats',
        price: 0.45,
        change24h: 12.5,
        volume: 15.2,
        marketCap: 125.8,
        genre: 'Electronic',
        trending: true
      },
      {
        id: '2',
        title: 'Forest Whispers',
        artist: 'Nature Sounds',
        price: 0.32,
        change24h: -5.2,
        volume: 8.7,
        marketCap: 89.3,
        genre: 'Ambient'
      },
      {
        id: '3',
        title: 'Neon Nights',
        artist: 'Synth Wave',
        price: 0.78,
        change24h: 8.9,
        volume: 22.1,
        marketCap: 198.5,
        genre: 'Synthwave',
        trending: true
      },
      {
        id: '4',
        title: 'Mountain Echo',
        artist: 'Alpine Sounds',
        price: 0.56,
        change24h: 3.4,
        volume: 12.8,
        marketCap: 156.2,
        genre: 'Folk'
      }
    ];
  }

  private getMockPortfolioStats(): PortfolioStats {
    return {
      totalInvestment: 4.3,
      currentValue: 4.75,
      dailyReturn: 0.04,
      totalReturn: 0.45,
      returnPercentage: 10.47,
      mrtHoldings: 860,
      portfolioCount: 3
    };
  }

  private getMockDeFiMetrics(): DeFiMetrics {
    return {
      totalValueLocked: 2.4,
      stakingRewards: 0.15,
      liquidityPools: 1.8,
      governanceTokens: 450
    };
  }

  private getMockPortfolioHistory(): Array<{ x: string; y: number }> {
    return [
      { x: 'Jan', y: 4.2 },
      { x: 'Feb', y: 4.8 },
      { x: 'Mar', y: 4.1 },
      { x: 'Apr', y: 5.2 },
      { x: 'May', y: 4.9 },
      { x: 'Jun', y: 5.8 }
    ];
  }
}

export default DashboardService.getInstance();