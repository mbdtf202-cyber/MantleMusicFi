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
export interface PlatformMetrics {
  totalUsers: number;
  activeArtists: number;
  totalRevenue: number;
  tradingVolume: number;
  userRetentionRate: number;
  averageROI: number;
  newTokensIssued: number;
}

export interface ChartDataPoint {
  x: string;
  y: number;
}

export interface PieChartData {
  label: string;
  value: number;
  color: string;
}

export interface AnalyticsData {
  platformMetrics: PlatformMetrics;
  revenueData: ChartDataPoint[];
  userGrowthData: ChartDataPoint[];
  topArtistsData: PieChartData[];
  genreDistribution: PieChartData[];
}

export class AnalyticsService {
  // 获取平台分析数据
  static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      // 暂时直接返回模拟数据，跳过API调用
      console.log('Using mock analytics data for testing');
      return this.getMockAnalyticsData();
      
      // TODO: 恢复API调用当认证问题解决后
      // const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYTICS.OVERVIEW}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // console.log('Analytics data received:', data);
      // return data.data || data;
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      // 返回模拟数据作为后备
      return this.getMockAnalyticsData();
    }
  }

  // 获取收入趋势数据
  static async getRevenueData(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ChartDataPoint[]> {
    try {
      // 暂时直接返回模拟数据
      console.log('Using mock revenue data for testing');
      return this.getMockRevenueData();
      
      // TODO: 恢复API调用
      // const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYTICS.REVENUE}?period=${period}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data.data || data;
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      return this.getMockRevenueData();
    }
  }

  // 获取用户增长数据
  static async getUserGrowthData(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ChartDataPoint[]> {
    try {
      // 暂时直接返回模拟数据
      console.log('Using mock user growth data for testing');
      return this.getMockUserGrowthData();
      
      // TODO: 恢复API调用
      // const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYTICS.USER_GROWTH}?period=${period}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data.data || data;
    } catch (error) {
      console.error('Failed to fetch user growth data:', error);
      return this.getMockUserGrowthData();
    }
  }

  // 获取顶级艺术家数据
  static async getTopArtistsData(): Promise<PieChartData[]> {
    try {
      // 暂时直接返回模拟数据
      console.log('Using mock top artists data for testing');
      return this.getMockTopArtistsData();
      
      // TODO: 恢复API调用
      // const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYTICS.TOP_ARTISTS}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data.data || data;
    } catch (error) {
      console.error('Failed to fetch top artists data:', error);
      return this.getMockTopArtistsData();
    }
  }

  // 获取音乐类型分布数据
  static async getGenreDistribution(): Promise<PieChartData[]> {
    try {
      // 暂时直接返回模拟数据
      console.log('Using mock genre distribution data for testing');
      return this.getMockGenreDistribution();
      
      // TODO: 恢复API调用
      // const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYTICS.GENRE_DISTRIBUTION}`, {
      //   headers: getAuthHeaders()
      // });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      // const data = await response.json();
      // return data.data || data;
    } catch (error) {
      console.error('Failed to fetch genre distribution data:', error);
      return this.getMockGenreDistribution();
    }
  }

  // 模拟数据方法
  private static getMockAnalyticsData(): AnalyticsData {
    return {
      platformMetrics: {
        totalUsers: 12500,
        activeArtists: 850,
        totalRevenue: 2847,
        tradingVolume: 15420,
        userRetentionRate: 85,
        averageROI: 2.4,
        newTokensIssued: 156
      },
      revenueData: this.getMockRevenueData(),
      userGrowthData: this.getMockUserGrowthData(),
      topArtistsData: this.getMockTopArtistsData(),
      genreDistribution: this.getMockGenreDistribution()
    };
  }

  private static getMockRevenueData(): ChartDataPoint[] {
    return [
      { x: 'Jan', y: 12000 },
      { x: 'Feb', y: 19000 },
      { x: 'Mar', y: 15000 },
      { x: 'Apr', y: 25000 },
      { x: 'May', y: 22000 },
      { x: 'Jun', y: 30000 },
      { x: 'Jul', y: 28000 },
    ];
  }

  private static getMockUserGrowthData(): ChartDataPoint[] {
    return [
      { x: 'Jan', y: 1200 },
      { x: 'Feb', y: 1900 },
      { x: 'Mar', y: 3000 },
      { x: 'Apr', y: 5000 },
      { x: 'May', y: 7200 },
      { x: 'Jun', y: 9800 },
      { x: 'Jul', y: 12500 },
    ];
  }

  private static getMockTopArtistsData(): PieChartData[] {
    return [
      { label: 'Artist A', value: 45, color: '#3B82F6' },
      { label: 'Artist B', value: 32, color: '#8B5CF6' },
      { label: 'Artist C', value: 28, color: '#F59E0B' },
      { label: 'Artist D', value: 25, color: '#EF4444' },
      { label: 'Artist E', value: 20, color: '#10B981' },
    ];
  }

  private static getMockGenreDistribution(): PieChartData[] {
    return [
      { label: 'Electronic', value: 35, color: '#3B82F6' },
      { label: 'Pop', value: 28, color: '#8B5CF6' },
      { label: 'Rock', value: 20, color: '#F59E0B' },
      { label: 'Classical', value: 12, color: '#EF4444' },
      { label: 'Others', value: 5, color: '#10B981' },
    ];
  }
}

export default AnalyticsService;