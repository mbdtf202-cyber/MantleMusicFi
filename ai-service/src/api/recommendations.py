"""
音乐推荐API
提供个性化推荐、相似音乐推荐、流行趋势等功能
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from pydantic import BaseModel, Field

from services.model_manager import ModelManager

logger = logging.getLogger(__name__)

router = APIRouter()

# 请求/响应模型
class UserPreferences(BaseModel):
    """用户偏好"""
    user_id: str = Field(..., description="用户ID")
    favorite_genres: List[str] = Field(default=[], description="喜欢的流派")
    favorite_artists: List[str] = Field(default=[], description="喜欢的艺术家")
    listening_history: List[str] = Field(default=[], description="听歌历史（音乐ID列表）")
    mood_preference: Optional[str] = Field(None, description="情绪偏好")
    activity_context: Optional[str] = Field(None, description="活动场景")

class RecommendationRequest(BaseModel):
    """推荐请求"""
    user_preferences: UserPreferences
    recommendation_type: str = Field("hybrid", description="推荐类型: collaborative, content, hybrid")
    limit: int = Field(10, ge=1, le=50, description="推荐数量")
    exclude_listened: bool = Field(True, description="是否排除已听过的音乐")

class SimilarMusicRequest(BaseModel):
    """相似音乐推荐请求"""
    music_id: str = Field(..., description="音乐ID")
    limit: int = Field(10, ge=1, le=50, description="推荐数量")
    similarity_threshold: float = Field(0.5, ge=0.0, le=1.0, description="相似度阈值")

class TrendingRequest(BaseModel):
    """流行趋势请求"""
    time_period: str = Field("week", description="时间周期: day, week, month, year")
    genre: Optional[str] = Field(None, description="流派过滤")
    region: Optional[str] = Field(None, description="地区过滤")
    limit: int = Field(20, ge=1, le=100, description="返回数量")

class RecommendationResponse(BaseModel):
    """推荐响应"""
    success: bool
    data: Dict[str, Any]
    message: str = ""

# 依赖注入
async def get_model_manager(request: Request) -> ModelManager:
    """获取模型管理器"""
    model_manager = getattr(request.app.state, 'model_manager', None)
    if model_manager is None:
        raise HTTPException(status_code=500, detail="模型管理器未初始化")
    return model_manager

@router.post("/personalized", response_model=RecommendationResponse)
async def get_personalized_recommendations(
    request: RecommendationRequest,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """
    获取个性化推荐
    
    - **user_preferences**: 用户偏好信息
    - **recommendation_type**: 推荐算法类型
    - **limit**: 推荐数量
    - **exclude_listened**: 是否排除已听过的音乐
    """
    try:
        logger.info(f"为用户 {request.user_preferences.user_id} 生成个性化推荐")
        
        recommendations = []
        
        if request.recommendation_type == "collaborative":
            # 协同过滤推荐
            collaborative_model = model_manager.get_model('collaborative_filtering')
            if collaborative_model:
                recommendations = collaborative_model.recommend(
                    user_id=request.user_preferences.user_id,
                    limit=request.limit,
                    exclude_listened=request.exclude_listened
                )
        
        elif request.recommendation_type == "content":
            # 基于内容的推荐
            content_model = model_manager.get_model('content_based')
            if content_model:
                recommendations = content_model.recommend(
                    user_preferences=request.user_preferences.dict(),
                    limit=request.limit
                )
        
        else:  # hybrid
            # 混合推荐
            hybrid_model = model_manager.get_model('hybrid_recommender')
            if hybrid_model:
                # 使用用户ID进行混合推荐
                raw_recommendations = hybrid_model.recommend(
                    user_id=request.user_preferences.user_id,
                    n_recommendations=request.limit
                )
                # 转换为标准格式
                recommendations = []
                for i, music_id in enumerate(raw_recommendations):
                    recommendations.append({
                        "music_id": music_id,
                        "title": f"推荐歌曲 {i+1}",
                        "artist": "未知艺术家",
                        "score": 0.8 - (i * 0.1),
                        "genre": "流行"
                    })
            else:
                # 如果没有混合模型，使用简化的混合策略
                recommendations = generate_hybrid_recommendations(
                    request.user_preferences,
                    request.limit,
                    model_manager
                )
        
        # 添加推荐理由
        enriched_recommendations = []
        for rec in recommendations:
            enriched_rec = {
                **rec,
                "reason": generate_recommendation_reason(rec, request.user_preferences)
            }
            enriched_recommendations.append(enriched_rec)
        
        return RecommendationResponse(
            success=True,
            data={
                "recommendations": enriched_recommendations,
                "user_id": request.user_preferences.user_id,
                "recommendation_type": request.recommendation_type,
                "total_count": len(enriched_recommendations)
            },
            message="个性化推荐生成成功"
        )
        
    except Exception as e:
        logger.error(f"个性化推荐失败: {e}")
        raise HTTPException(status_code=500, detail=f"推荐生成失败: {str(e)}")

@router.post("/similar", response_model=RecommendationResponse)
async def get_similar_music(
    request: SimilarMusicRequest,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """
    获取相似音乐推荐
    
    - **music_id**: 目标音乐ID
    - **limit**: 推荐数量
    - **similarity_threshold**: 相似度阈值
    """
    try:
        logger.info(f"为音乐 {request.music_id} 查找相似音乐")
        
        # 使用简化的相似度计算
        similar_music = generate_simple_similar_music(
            request.music_id,
            request.limit,
            request.similarity_threshold
        )
        
        return RecommendationResponse(
            success=True,
            data={
                "similar_music": similar_music,
                "source_music_id": request.music_id,
                "similarity_threshold": request.similarity_threshold,
                "total_count": len(similar_music)
            },
            message="相似音乐推荐生成成功"
        )
        
    except Exception as e:
        logger.error(f"相似音乐推荐失败: {e}")
        raise HTTPException(status_code=500, detail=f"相似音乐推荐失败: {str(e)}")

@router.post("/trending", response_model=RecommendationResponse)
async def get_trending_music(
    request: TrendingRequest
):
    """
    获取流行趋势音乐
    
    - **time_period**: 时间周期
    - **genre**: 流派过滤
    - **region**: 地区过滤
    - **limit**: 返回数量
    """
    try:
        logger.info(f"获取 {request.time_period} 流行趋势")
        
        # 生成流行趋势数据（模拟）
        trending_music = generate_trending_music(
            time_period=request.time_period,
            genre=request.genre,
            region=request.region,
            limit=request.limit
        )
        
        return RecommendationResponse(
            success=True,
            data={
                "trending_music": trending_music,
                "time_period": request.time_period,
                "genre": request.genre,
                "region": request.region,
                "total_count": len(trending_music)
            },
            message="流行趋势获取成功"
        )
        
    except Exception as e:
        logger.error(f"流行趋势获取失败: {e}")
        raise HTTPException(status_code=500, detail=f"流行趋势获取失败: {str(e)}")

@router.get("/genres")
async def get_popular_genres():
    """获取热门流派"""
    try:
        genres = [
            {"name": "Pop", "popularity": 0.95, "description": "流行音乐"},
            {"name": "Rock", "popularity": 0.88, "description": "摇滚音乐"},
            {"name": "Hip-Hop", "popularity": 0.92, "description": "嘻哈音乐"},
            {"name": "Electronic", "popularity": 0.85, "description": "电子音乐"},
            {"name": "R&B", "popularity": 0.78, "description": "节奏布鲁斯"},
            {"name": "Jazz", "popularity": 0.65, "description": "爵士音乐"},
            {"name": "Classical", "popularity": 0.58, "description": "古典音乐"},
            {"name": "Country", "popularity": 0.72, "description": "乡村音乐"},
            {"name": "Reggae", "popularity": 0.68, "description": "雷鬼音乐"},
            {"name": "Folk", "popularity": 0.62, "description": "民谣音乐"}
        ]
        
        return {
            "success": True,
            "data": {
                "genres": sorted(genres, key=lambda x: x["popularity"], reverse=True)
            }
        }
        
    except Exception as e:
        logger.error(f"获取流派失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取流派失败: {str(e)}")

@router.get("/moods")
async def get_mood_categories():
    """获取情绪分类"""
    try:
        moods = [
            {"name": "happy", "description": "快乐", "color": "#FFD700"},
            {"name": "sad", "description": "悲伤", "color": "#4169E1"},
            {"name": "energetic", "description": "充满活力", "color": "#FF4500"},
            {"name": "peaceful", "description": "平静", "color": "#98FB98"},
            {"name": "romantic", "description": "浪漫", "color": "#FF69B4"},
            {"name": "aggressive", "description": "激进", "color": "#DC143C"},
            {"name": "melancholic", "description": "忧郁", "color": "#9370DB"},
            {"name": "uplifting", "description": "振奋", "color": "#FFA500"}
        ]
        
        return {
            "success": True,
            "data": {
                "moods": moods
            }
        }
        
    except Exception as e:
        logger.error(f"获取情绪分类失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取情绪分类失败: {str(e)}")

# 辅助函数
def generate_hybrid_recommendations(
    user_preferences: UserPreferences,
    limit: int,
    model_manager: ModelManager
) -> List[Dict[str, Any]]:
    """生成混合推荐"""
    try:
        recommendations = []
        
        # 基于流派的推荐
        for genre in user_preferences.favorite_genres[:3]:
            genre_recs = generate_genre_based_recommendations(genre, limit // 3)
            recommendations.extend(genre_recs)
        
        # 基于艺术家的推荐
        for artist in user_preferences.favorite_artists[:2]:
            artist_recs = generate_artist_based_recommendations(artist, limit // 4)
            recommendations.extend(artist_recs)
        
        # 基于情绪的推荐
        if user_preferences.mood_preference:
            mood_recs = generate_mood_based_recommendations(
                user_preferences.mood_preference, 
                limit // 4
            )
            recommendations.extend(mood_recs)
        
        # 去重并限制数量
        unique_recs = []
        seen_ids = set()
        for rec in recommendations:
            if rec["music_id"] not in seen_ids:
                unique_recs.append(rec)
                seen_ids.add(rec["music_id"])
                if len(unique_recs) >= limit:
                    break
        
        return unique_recs
        
    except Exception as e:
        logger.error(f"混合推荐生成失败: {e}")
        return []

def generate_genre_based_recommendations(genre: str, limit: int) -> List[Dict[str, Any]]:
    """基于流派的推荐"""
    # 模拟数据
    return [
        {
            "music_id": f"genre_{genre}_{i}",
            "title": f"{genre} Song {i}",
            "artist": f"Artist {i}",
            "genre": genre,
            "score": 0.9 - i * 0.1,
            "reason_type": "genre_match"
        }
        for i in range(1, min(limit + 1, 6))
    ]

def generate_artist_based_recommendations(artist: str, limit: int) -> List[Dict[str, Any]]:
    """基于艺术家的推荐"""
    # 模拟数据
    return [
        {
            "music_id": f"artist_{artist}_{i}",
            "title": f"Song {i} by {artist}",
            "artist": artist,
            "genre": "Pop",
            "score": 0.85 - i * 0.1,
            "reason_type": "artist_match"
        }
        for i in range(1, min(limit + 1, 4))
    ]

def generate_mood_based_recommendations(mood: str, limit: int) -> List[Dict[str, Any]]:
    """基于情绪的推荐"""
    # 模拟数据
    return [
        {
            "music_id": f"mood_{mood}_{i}",
            "title": f"{mood.title()} Vibes {i}",
            "artist": f"Mood Artist {i}",
            "genre": "Pop",
            "mood": mood,
            "score": 0.8 - i * 0.1,
            "reason_type": "mood_match"
        }
        for i in range(1, min(limit + 1, 4))
    ]

def generate_simple_similar_music(
    music_id: str, 
    limit: int, 
    threshold: float
) -> List[Dict[str, Any]]:
    """生成简单的相似音乐"""
    # 模拟相似音乐数据
    return [
        {
            "music_id": f"similar_{music_id}_{i}",
            "title": f"Similar Song {i}",
            "artist": f"Similar Artist {i}",
            "genre": "Pop",
            "similarity_score": threshold + (1 - threshold) * (1 - i * 0.1),
            "reason": "Similar audio features"
        }
        for i in range(1, min(limit + 1, 11))
        if threshold + (1 - threshold) * (1 - i * 0.1) >= threshold
    ]

def generate_trending_music(
    time_period: str,
    genre: Optional[str],
    region: Optional[str],
    limit: int
) -> List[Dict[str, Any]]:
    """生成流行趋势音乐"""
    # 模拟流行音乐数据
    trending = []
    
    for i in range(1, min(limit + 1, 21)):
        music = {
            "music_id": f"trending_{time_period}_{i}",
            "title": f"Trending Song {i}",
            "artist": f"Popular Artist {i}",
            "genre": genre or "Pop",
            "rank": i,
            "play_count": 1000000 - i * 50000,
            "growth_rate": 0.5 - i * 0.02,
            "region": region or "global"
        }
        trending.append(music)
    
    return trending

def generate_recommendation_reason(
    recommendation: Dict[str, Any],
    user_preferences: UserPreferences
) -> str:
    """生成推荐理由"""
    try:
        reason_type = recommendation.get("reason_type", "general")
        
        if reason_type == "genre_match":
            return f"因为你喜欢 {recommendation.get('genre', '')} 音乐"
        elif reason_type == "artist_match":
            return f"因为你喜欢 {recommendation.get('artist', '')} 的音乐"
        elif reason_type == "mood_match":
            return f"符合你的 {recommendation.get('mood', '')} 情绪偏好"
        else:
            return "基于你的音乐偏好推荐"
            
    except Exception:
        return "为你推荐"