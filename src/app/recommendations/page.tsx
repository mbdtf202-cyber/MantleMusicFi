'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Music, Play, Heart, Clock, Loader2 } from 'lucide-react';
import recommendationService, { MusicRecommendation, RecommendationRequest } from '@/services/recommendationService';

// 使用从 recommendationService 导入的类型

const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<MusicRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [recommendationType, setRecommendationType] = useState<'hybrid' | 'collaborative' | 'content_based'>('hybrid');

  const genres = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'R&B', 'Jazz', 'Classical', 'Country'];
  const recommendationTypes = [
    { value: 'hybrid' as const, label: 'Hybrid (AI + Collaborative)' },
    { value: 'collaborative' as const, label: 'Collaborative Filtering' },
    { value: 'content_based' as const, label: 'Content-Based' }
  ];

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params: RecommendationRequest = {
        limit: 10,
        recommendation_type: recommendationType
      };
      
      if (selectedGenre) {
        params.genre = selectedGenre;
      }

      const response = await recommendationService.getRecommendations(params);
      
      if (response.success) {
         setRecommendations(response.data.recommendations || []);
       } else {
         setError('Failed to fetch recommendations');
       }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Error fetching recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 移除自动加载，让用户手动触发推荐

  const formatDuration = (duration: string | number | undefined): string => {
    if (!duration) return '0:00';
    if (typeof duration === 'string') return duration;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AI Music Recommendations
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Personalized music recommendations powered by AI
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Music Genre
                </label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recommendation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Algorithm Type
                </label>
                <Select value={recommendationType} onValueChange={(value) => setRecommendationType(value as any)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recommendationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end">
                <Button 
                  onClick={fetchRecommendations}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Recommendations
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <Card className="p-8 bg-red-900/20 border-red-500/30 text-center">
            <div className="text-red-400 mb-4">
              <Music className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Loading Failed</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button
              onClick={fetchRecommendations}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Retry
            </Button>
          </Card>
        ) : recommendations.length === 0 ? (
          <Card className="p-8 bg-gray-800/30 border-gray-700 text-center">
            <div className="text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recommendations</h3>
              <p className="text-sm">No music recommendations found for the current criteria</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((track, index) => (
              <Card key={track.id || index} className="p-6 bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    {track.cover_url ? (
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Music className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate mb-1">
                      {track.title}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                      <Music className="w-3 h-3" />
                      <span className="truncate">{track.artist}</span>
                    </div>
                    
                    {track.genre && (
                      <Badge variant="secondary" className="text-xs mb-2">
                        {track.genre}
                      </Badge>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {track.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(track.duration)}</span>
                        </div>
                      )}
                      
                      {track.confidence_score && (
                        <div className="text-purple-400 font-medium">
                          {Math.round(track.confidence_score * 100)}% match
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Play
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-400 hover:text-white"
                      >
                        <Heart className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;