import { API_BASE_URL } from '@/config/api';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  mrtTokens?: number;
  revenue?: number;
  genre?: string;
  description?: string;
  lyrics?: string;
  collaborators?: string[];
  tags?: string[];
  coverUrl?: string;
  audioUrl?: string;
}

export interface ArtistStats {
  totalTracks: number;
  totalTokens: number;
  totalRevenue: number;
  monthlyListeners: number;
}

export interface UploadTrackData {
  title: string;
  artist: string;
  album?: string;
  releaseYear?: number;
  genre: string;
  duration: number;
  description?: string;
  lyrics?: string;
  collaborators?: string[];
  tags?: string[];
}

export interface TokenizeTrackData {
  tokenName: string;
  tokenSymbol: string;
  totalSupply: number;
  initialPrice: number;
  royaltyPercentage: number;
  description?: string;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  revenueBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  chartData: Array<{
    date: string;
    revenue: number;
    streams: number;
  }>;
}

class ArtistService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/artist`;
  }

  // 获取艺术家仪表板数据
  async getDashboard(): Promise<{
    stats: ArtistStats;
    recentTracks: Track[];
    recentActivity: any[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // 返回模拟数据作为后备
      return this.getMockDashboardData();
    }
  }

  // 上传音乐文件
  async uploadTrack(formData: FormData): Promise<{ success: boolean; track?: Track; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, track: result.music };
    } catch (error) {
      console.error('Failed to upload track:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  // 获取艺术家的所有音乐
  async getTracks(page: number = 1, limit: number = 10): Promise<{
    tracks: Track[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/tracks?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      // 返回模拟数据作为后备
      return this.getMockTracksData();
    }
  }

  // 代币化音乐
  async tokenizeTrack(musicId: string, tokenData: TokenizeTrackData): Promise<{
    success: boolean;
    token?: any;
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${musicId}/tokenize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(tokenData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, token: result.token };
    } catch (error) {
      console.error('Failed to tokenize track:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Tokenization failed' 
      };
    }
  }

  // 获取收入报告
  async getRevenueReport(period: string = 'month'): Promise<RevenueReport> {
    try {
      const response = await fetch(`${this.baseUrl}/revenue/report?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
      // 返回模拟数据作为后备
      return this.getMockRevenueReport();
    }
  }

  // 分发收入
  async distributeRevenue(musicId: string, amount: number, source: string, description?: string): Promise<{
    success: boolean;
    distribution?: any;
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${musicId}/distribute-revenue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ amount, source, description })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, distribution: result.distribution };
    } catch (error) {
      console.error('Failed to distribute revenue:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Revenue distribution failed' 
      };
    }
  }

  // 获取代币列表
  async getTokens(page: number = 1, limit: number = 10): Promise<{
    tokens: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      // 返回模拟数据作为后备
      return { tokens: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  // 更新代币价格
  async updateTokenPrice(tokenId: string, newPrice: number): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/tokens/${tokenId}/price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ newPrice })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update token price:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Price update failed' 
      };
    }
  }

  // 获取认证令牌
  private getAuthToken(): string {
    // 这里应该从localStorage或其他地方获取实际的认证令牌
    return localStorage.getItem('authToken') || '';
  }

  // 模拟数据方法
  private getMockDashboardData() {
    return {
      stats: {
        totalTracks: 12,
        totalTokens: 45200,
        totalRevenue: 8750,
        monthlyListeners: 2800
      },
      recentTracks: [
        {
          id: '1',
          title: 'Brightest Star in the Night Sky',
          artist: 'Escape Plan',
          duration: '4:32',
          uploadDate: '2024-01-15',
          status: 'approved' as const,
          mrtTokens: 10000,
          revenue: 2500
        },
        {
          id: '2',
          title: 'Youth',
          artist: 'Mao Buyi',
          duration: '3:45',
          uploadDate: '2024-01-10',
          status: 'pending' as const,
        },
        {
          id: '3',
          title: 'People Like Me',
          artist: 'Mao Buyi',
          duration: '4:18',
          uploadDate: '2024-01-08',
          status: 'approved' as const,
          mrtTokens: 8500,
          revenue: 1800
        }
      ],
      recentActivity: []
    };
  }

  private getMockTracksData() {
    return {
      tracks: this.getMockDashboardData().recentTracks,
      total: 3,
      page: 1,
      totalPages: 1
    };
  }

  private getMockRevenueReport(): RevenueReport {
    return {
      period: 'month',
      totalRevenue: 8750,
      revenueBySource: [
        { source: 'streaming', amount: 5250, percentage: 60 },
        { source: 'sales', amount: 2100, percentage: 24 },
        { source: 'licensing', amount: 1400, percentage: 16 }
      ],
      chartData: [
        { date: '2024-01-01', revenue: 1200, streams: 450 },
        { date: '2024-01-02', revenue: 1350, streams: 520 },
        { date: '2024-01-03', revenue: 1100, streams: 380 },
        { date: '2024-01-04', revenue: 1500, streams: 600 },
        { date: '2024-01-05', revenue: 1800, streams: 720 },
        { date: '2024-01-06', revenue: 1600, streams: 650 },
        { date: '2024-01-07', revenue: 1200, streams: 480 }
      ]
    };
  }
}

export const artistService = new ArtistService();