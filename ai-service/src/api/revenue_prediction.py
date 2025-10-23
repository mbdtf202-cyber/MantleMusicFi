"""
收益预测API模块
提供音乐作品收益预测、市场分析和投资建议
"""

import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
import asyncio
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/revenue", tags=["Revenue Prediction"])

# 数据模型
class MusicMetadata(BaseModel):
    """音乐元数据"""
    title: str
    artist: str
    genre: str
    duration: int  # 秒
    release_date: datetime
    language: str = "en"
    explicit: bool = False
    features: Dict[str, Any] = {}  # 音频特征

class HistoricalData(BaseModel):
    """历史数据"""
    streams: List[int] = []
    revenue: List[float] = []
    dates: List[datetime] = []
    platforms: Dict[str, List[float]] = {}

class MarketConditions(BaseModel):
    """市场条件"""
    genre_popularity: float = Field(ge=0, le=1)
    seasonal_factor: float = Field(ge=0, le=2)
    competition_level: float = Field(ge=0, le=1)
    platform_trends: Dict[str, float] = {}

class PredictionRequest(BaseModel):
    """预测请求"""
    music_metadata: MusicMetadata
    historical_data: Optional[HistoricalData] = None
    market_conditions: Optional[MarketConditions] = None
    prediction_period: int = Field(default=365, ge=1, le=1095)  # 预测天数
    confidence_level: float = Field(default=0.95, ge=0.8, le=0.99)

class RevenuePrediction(BaseModel):
    """收益预测结果"""
    predicted_revenue: float
    confidence_interval: Dict[str, float]
    breakdown_by_platform: Dict[str, float]
    breakdown_by_period: List[Dict[str, Any]]
    risk_factors: List[str]
    recommendations: List[str]
    model_accuracy: float
    prediction_date: datetime

class MarketAnalysis(BaseModel):
    """市场分析结果"""
    genre_trends: Dict[str, float]
    competitive_landscape: Dict[str, Any]
    optimal_release_timing: Dict[str, Any]
    pricing_recommendations: Dict[str, float]
    target_demographics: Dict[str, Any]

# 模拟的机器学习模型
class RevenuePredictionModel:
    """收益预测模型"""
    
    def __init__(self):
        self.model_accuracy = 0.85
        self.feature_weights = {
            'genre_popularity': 0.25,
            'artist_followers': 0.20,
            'track_quality': 0.15,
            'release_timing': 0.15,
            'marketing_budget': 0.10,
            'platform_reach': 0.10,
            'seasonal_factor': 0.05
        }
    
    async def predict_revenue(self, request: PredictionRequest) -> RevenuePrediction:
        """预测收益"""
        try:
            # 模拟复杂的预测计算
            await asyncio.sleep(0.1)  # 模拟计算时间
            
            # 基础收益计算
            base_revenue = self._calculate_base_revenue(request.music_metadata)
            
            # 应用市场条件调整
            if request.market_conditions:
                base_revenue *= request.market_conditions.genre_popularity
                base_revenue *= request.market_conditions.seasonal_factor
            
            # 历史数据调整
            if request.historical_data and request.historical_data.revenue:
                historical_avg = np.mean(request.historical_data.revenue)
                base_revenue = (base_revenue + historical_avg) / 2
            
            # 时间衰减因子
            time_factor = max(0.1, 1 - (request.prediction_period / 365) * 0.3)
            predicted_revenue = base_revenue * time_factor
            
            # 置信区间计算
            confidence_margin = predicted_revenue * (1 - request.confidence_level) * 2
            confidence_interval = {
                'lower': max(0, predicted_revenue - confidence_margin),
                'upper': predicted_revenue + confidence_margin
            }
            
            # 平台分解
            platform_breakdown = self._calculate_platform_breakdown(predicted_revenue)
            
            # 时间分解
            period_breakdown = self._calculate_period_breakdown(
                predicted_revenue, request.prediction_period
            )
            
            # 风险因素分析
            risk_factors = self._analyze_risk_factors(request)
            
            # 生成建议
            recommendations = self._generate_recommendations(request, predicted_revenue)
            
            return RevenuePrediction(
                predicted_revenue=predicted_revenue,
                confidence_interval=confidence_interval,
                breakdown_by_platform=platform_breakdown,
                breakdown_by_period=period_breakdown,
                risk_factors=risk_factors,
                recommendations=recommendations,
                model_accuracy=self.model_accuracy,
                prediction_date=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Revenue prediction error: {e}")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    def _calculate_base_revenue(self, metadata: MusicMetadata) -> float:
        """计算基础收益"""
        # 流派基础收益
        genre_multipliers = {
            'pop': 1.2,
            'rock': 1.0,
            'hip-hop': 1.3,
            'electronic': 0.9,
            'classical': 0.7,
            'jazz': 0.6,
            'country': 0.8,
            'r&b': 1.1
        }
        
        base = 1000  # 基础收益
        genre_mult = genre_multipliers.get(metadata.genre.lower(), 1.0)
        
        # 时长调整
        duration_factor = min(1.5, max(0.5, metadata.duration / 180))  # 3分钟为标准
        
        # 发布时间调整（新歌有优势）
        days_since_release = (datetime.now() - metadata.release_date).days
        recency_factor = max(0.3, 1 - (days_since_release / 365) * 0.5)
        
        return base * genre_mult * duration_factor * recency_factor
    
    def _calculate_platform_breakdown(self, total_revenue: float) -> Dict[str, float]:
        """计算平台收益分解"""
        platform_shares = {
            'spotify': 0.35,
            'apple_music': 0.25,
            'youtube_music': 0.20,
            'amazon_music': 0.10,
            'other': 0.10
        }
        
        return {
            platform: total_revenue * share
            for platform, share in platform_shares.items()
        }
    
    def _calculate_period_breakdown(self, total_revenue: float, days: int) -> List[Dict[str, Any]]:
        """计算时间段收益分解"""
        breakdown = []
        
        # 收益衰减模式（前期高，后期低）
        for month in range(min(12, days // 30 + 1)):
            decay_factor = max(0.1, 1 - (month * 0.15))
            monthly_revenue = (total_revenue / 12) * decay_factor
            
            breakdown.append({
                'period': f'Month {month + 1}',
                'revenue': monthly_revenue,
                'cumulative': sum(item['revenue'] for item in breakdown) + monthly_revenue,
                'growth_rate': -15 if month > 0 else 0  # 月度衰减率
            })
        
        return breakdown
    
    def _analyze_risk_factors(self, request: PredictionRequest) -> List[str]:
        """分析风险因素"""
        risks = []
        
        # 市场风险
        if request.market_conditions:
            if request.market_conditions.competition_level > 0.7:
                risks.append("High competition in genre")
            if request.market_conditions.genre_popularity < 0.3:
                risks.append("Low genre popularity")
        
        # 历史数据风险
        if not request.historical_data or not request.historical_data.revenue:
            risks.append("Limited historical data")
        
        # 时间风险
        if request.prediction_period > 730:  # 2年以上
            risks.append("Long-term prediction uncertainty")
        
        # 艺术家风险
        if not request.music_metadata.features:
            risks.append("Limited artist performance data")
        
        return risks
    
    def _generate_recommendations(self, request: PredictionRequest, predicted_revenue: float) -> List[str]:
        """生成建议"""
        recommendations = []
        
        # 基于预测收益的建议
        if predicted_revenue < 500:
            recommendations.append("Consider increasing marketing budget")
            recommendations.append("Explore collaboration opportunities")
        elif predicted_revenue > 5000:
            recommendations.append("Consider premium pricing strategy")
            recommendations.append("Expand to additional platforms")
        
        # 基于流派的建议
        genre = request.music_metadata.genre.lower()
        if genre in ['pop', 'hip-hop']:
            recommendations.append("Focus on social media promotion")
        elif genre in ['classical', 'jazz']:
            recommendations.append("Target niche streaming platforms")
        
        # 基于市场条件的建议
        if request.market_conditions:
            if request.market_conditions.seasonal_factor > 1.2:
                recommendations.append("Optimize for seasonal trends")
            if request.market_conditions.competition_level > 0.8:
                recommendations.append("Differentiate through unique features")
        
        return recommendations

# 全局模型实例
prediction_model = RevenuePredictionModel()

@router.post("/predict", response_model=RevenuePrediction)
async def predict_revenue(request: PredictionRequest):
    """
    预测音乐作品收益
    
    - **music_metadata**: 音乐元数据
    - **historical_data**: 历史数据（可选）
    - **market_conditions**: 市场条件（可选）
    - **prediction_period**: 预测期间（天数）
    - **confidence_level**: 置信水平
    """
    try:
        logger.info(f"Predicting revenue for: {request.music_metadata.title}")
        result = await prediction_model.predict_revenue(request)
        logger.info(f"Prediction completed: ${result.predicted_revenue:.2f}")
        return result
    except Exception as e:
        logger.error(f"Revenue prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-analysis/{genre}")
async def get_market_analysis(
    genre: str,
    region: str = Query(default="global", description="目标地区"),
    time_period: int = Query(default=30, ge=1, le=365, description="分析时间段（天）")
) -> MarketAnalysis:
    """
    获取市场分析
    
    - **genre**: 音乐流派
    - **region**: 目标地区
    - **time_period**: 分析时间段
    """
    try:
        # 模拟市场分析
        await asyncio.sleep(0.2)
        
        # 流派趋势
        genre_trends = {
            'current_popularity': np.random.uniform(0.3, 0.9),
            'growth_rate': np.random.uniform(-0.1, 0.2),
            'market_share': np.random.uniform(0.05, 0.25),
            'competition_index': np.random.uniform(0.4, 0.9)
        }
        
        # 竞争格局
        competitive_landscape = {
            'top_artists': [
                {'name': f'Artist {i}', 'market_share': np.random.uniform(0.1, 0.3)}
                for i in range(1, 6)
            ],
            'entry_barriers': np.random.uniform(0.3, 0.8),
            'market_saturation': np.random.uniform(0.4, 0.9)
        }
        
        # 最佳发布时机
        optimal_timing = {
            'best_day_of_week': np.random.choice(['Friday', 'Thursday', 'Tuesday']),
            'best_month': np.random.choice(['March', 'September', 'November']),
            'seasonal_factor': np.random.uniform(0.8, 1.3),
            'holiday_impact': np.random.uniform(-0.2, 0.4)
        }
        
        # 定价建议
        pricing_recommendations = {
            'streaming_rate': np.random.uniform(0.003, 0.008),
            'download_price': np.random.uniform(0.99, 2.99),
            'premium_multiplier': np.random.uniform(1.2, 2.0)
        }
        
        # 目标人群
        target_demographics = {
            'age_groups': {
                '18-24': np.random.uniform(0.2, 0.4),
                '25-34': np.random.uniform(0.3, 0.5),
                '35-44': np.random.uniform(0.1, 0.3),
                '45+': np.random.uniform(0.05, 0.2)
            },
            'gender_split': {
                'male': np.random.uniform(0.4, 0.6),
                'female': np.random.uniform(0.4, 0.6)
            },
            'geographic_distribution': {
                'north_america': np.random.uniform(0.3, 0.5),
                'europe': np.random.uniform(0.2, 0.4),
                'asia': np.random.uniform(0.1, 0.3),
                'other': np.random.uniform(0.05, 0.15)
            }
        }
        
        return MarketAnalysis(
            genre_trends=genre_trends,
            competitive_landscape=competitive_landscape,
            optimal_release_timing=optimal_timing,
            pricing_recommendations=pricing_recommendations,
            target_demographics=target_demographics
        )
        
    except Exception as e:
        logger.error(f"Market analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/{genre}")
async def get_genre_trends(
    genre: str,
    days: int = Query(default=30, ge=7, le=365, description="趋势分析天数")
):
    """
    获取流派趋势数据
    
    - **genre**: 音乐流派
    - **days**: 分析天数
    """
    try:
        # 生成模拟趋势数据
        dates = [datetime.now() - timedelta(days=i) for i in range(days, 0, -1)]
        
        # 生成趋势数据（带有一些随机波动）
        base_popularity = np.random.uniform(0.4, 0.8)
        trend = np.random.uniform(-0.001, 0.001)  # 每日趋势
        noise = np.random.normal(0, 0.02, days)  # 随机噪声
        
        popularity_scores = []
        for i in range(days):
            score = base_popularity + (trend * i) + noise[i]
            score = max(0, min(1, score))  # 限制在0-1之间
            popularity_scores.append(score)
        
        # 计算统计信息
        avg_popularity = np.mean(popularity_scores)
        trend_direction = "increasing" if trend > 0 else "decreasing" if trend < 0 else "stable"
        volatility = np.std(popularity_scores)
        
        return {
            "success": True,
            "data": {
                "genre": genre,
                "period": f"{days} days",
                "trend_data": [
                    {
                        "date": dates[i].isoformat(),
                        "popularity_score": popularity_scores[i],
                        "streams": int(popularity_scores[i] * 1000000 * np.random.uniform(0.8, 1.2)),
                        "revenue": popularity_scores[i] * 50000 * np.random.uniform(0.9, 1.1)
                    }
                    for i in range(days)
                ],
                "statistics": {
                    "average_popularity": avg_popularity,
                    "trend_direction": trend_direction,
                    "volatility": volatility,
                    "peak_date": dates[np.argmax(popularity_scores)].isoformat(),
                    "peak_score": max(popularity_scores)
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Genre trends analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-predict")
async def batch_predict_revenue(
    requests: List[PredictionRequest] = Body(..., description="批量预测请求")
):
    """
    批量预测多个音乐作品的收益
    
    - **requests**: 预测请求列表
    """
    try:
        if len(requests) > 50:  # 限制批量大小
            raise HTTPException(status_code=400, detail="Batch size too large (max 50)")
        
        results = []
        for i, request in enumerate(requests):
            try:
                prediction = await prediction_model.predict_revenue(request)
                results.append({
                    "index": i,
                    "success": True,
                    "prediction": prediction
                })
            except Exception as e:
                results.append({
                    "index": i,
                    "success": False,
                    "error": str(e)
                })
        
        successful_predictions = sum(1 for r in results if r["success"])
        
        return {
            "success": True,
            "message": f"Processed {len(requests)} requests, {successful_predictions} successful",
            "results": results,
            "summary": {
                "total_requests": len(requests),
                "successful": successful_predictions,
                "failed": len(requests) - successful_predictions
            }
        }
        
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/info")
async def get_model_info():
    """
    获取预测模型信息
    """
    return {
        "success": True,
        "data": {
            "model_name": "MantleMusic Revenue Predictor v1.0",
            "accuracy": prediction_model.model_accuracy,
            "feature_weights": prediction_model.feature_weights,
            "supported_genres": [
                "pop", "rock", "hip-hop", "electronic", 
                "classical", "jazz", "country", "r&b"
            ],
            "prediction_range": "1-1095 days",
            "confidence_levels": "80%-99%",
            "last_updated": datetime.now().isoformat()
        }
    }