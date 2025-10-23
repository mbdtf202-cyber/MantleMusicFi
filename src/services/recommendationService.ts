import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

export interface RecommendationRequest {
  limit?: number;
  genre?: string;
  recommendation_type?: 'hybrid' | 'collaborative' | 'content_based';
  user_id?: string;
}

export interface MusicRecommendation {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  cover_url?: string;
  audio_url?: string;
  confidence_score?: number;
}

export interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations: MusicRecommendation[];
    total: number;
    recommendation_type: string;
  };
  message?: string;
}

class RecommendationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * 获取音乐推荐
   */
  async getRecommendations(params: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.genre) queryParams.append('genre', params.genre);
      if (params.recommendation_type) queryParams.append('recommendation_type', params.recommendation_type);
      if (params.user_id) queryParams.append('user_id', params.user_id);

      const url = `${this.baseUrl}${API_ENDPOINTS.MUSIC.RECOMMENDATIONS}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  /**
   * 获取个性化推荐
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<RecommendationResponse> {
    return this.getRecommendations({
      user_id: userId,
      limit,
      recommendation_type: 'hybrid'
    });
  }

  /**
   * 根据流派获取推荐
   */
  async getRecommendationsByGenre(genre: string, limit: number = 10): Promise<RecommendationResponse> {
    return this.getRecommendations({
      genre,
      limit,
      recommendation_type: 'content_based'
    });
  }

  /**
   * 获取协同过滤推荐
   */
  async getCollaborativeRecommendations(userId: string, limit: number = 10): Promise<RecommendationResponse> {
    return this.getRecommendations({
      user_id: userId,
      limit,
      recommendation_type: 'collaborative'
    });
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;