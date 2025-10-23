"""
信用评分API模块
提供艺术家和投资者的信用评分、风险评估和信用历史分析
"""

import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
import asyncio
import json
from enum import Enum

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/credit", tags=["Credit Scoring"])

# 枚举类型
class UserType(str, Enum):
    ARTIST = "artist"
    INVESTOR = "investor"
    LABEL = "label"
    PRODUCER = "producer"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class CreditGrade(str, Enum):
    AAA = "AAA"
    AA = "AA"
    A = "A"
    BBB = "BBB"
    BB = "BB"
    B = "B"
    CCC = "CCC"
    CC = "CC"
    C = "C"
    D = "D"

# 数据模型
class FinancialHistory(BaseModel):
    """财务历史"""
    total_revenue: float = 0
    revenue_history: List[Dict[str, Any]] = []
    payment_history: List[Dict[str, Any]] = []
    defaults: int = 0
    late_payments: int = 0
    total_transactions: int = 0
    average_transaction_size: float = 0

class ArtistMetrics(BaseModel):
    """艺术家指标"""
    total_streams: int = 0
    monthly_listeners: int = 0
    follower_count: int = 0
    engagement_rate: float = 0
    release_frequency: float = 0  # 每月发布数
    collaboration_count: int = 0
    chart_positions: List[int] = []
    awards_count: int = 0

class InvestorMetrics(BaseModel):
    """投资者指标"""
    total_invested: float = 0
    portfolio_size: int = 0
    successful_investments: int = 0
    failed_investments: int = 0
    average_roi: float = 0
    investment_duration_avg: float = 0  # 平均投资持续时间（天）
    diversification_score: float = 0

class BlockchainMetrics(BaseModel):
    """区块链指标"""
    wallet_age: int = 0  # 钱包年龄（天）
    transaction_count: int = 0
    total_volume: float = 0
    smart_contract_interactions: int = 0
    defi_participation: bool = False
    governance_participation: int = 0
    staking_amount: float = 0

class SocialMetrics(BaseModel):
    """社交指标"""
    social_media_followers: Dict[str, int] = {}
    social_engagement_rate: float = 0
    community_reputation: float = 0
    verified_accounts: int = 0
    negative_sentiment_ratio: float = 0

class CreditScoreRequest(BaseModel):
    """信用评分请求"""
    user_id: str
    user_type: UserType
    financial_history: FinancialHistory
    artist_metrics: Optional[ArtistMetrics] = None
    investor_metrics: Optional[InvestorMetrics] = None
    blockchain_metrics: BlockchainMetrics
    social_metrics: SocialMetrics
    additional_data: Dict[str, Any] = {}

class CreditScoreResult(BaseModel):
    """信用评分结果"""
    user_id: str
    credit_score: int = Field(ge=300, le=850)  # FICO风格评分
    credit_grade: CreditGrade
    risk_level: RiskLevel
    confidence: float = Field(ge=0, le=1)
    score_breakdown: Dict[str, float]
    risk_factors: List[str]
    positive_factors: List[str]
    recommendations: List[str]
    score_history: List[Dict[str, Any]] = []
    next_review_date: datetime
    created_at: datetime

class CreditAnalysis(BaseModel):
    """信用分析"""
    payment_reliability: float
    revenue_stability: float
    growth_potential: float
    market_position: float
    diversification: float
    liquidity: float
    overall_assessment: str

# 信用评分模型
class CreditScoringModel:
    """信用评分模型"""
    
    def __init__(self):
        # 评分权重配置
        self.artist_weights = {
            'financial_history': 0.35,
            'artist_metrics': 0.25,
            'blockchain_metrics': 0.20,
            'social_metrics': 0.15,
            'additional_factors': 0.05
        }
        
        self.investor_weights = {
            'financial_history': 0.40,
            'investor_metrics': 0.30,
            'blockchain_metrics': 0.20,
            'social_metrics': 0.10
        }
        
        # 风险阈值
        self.risk_thresholds = {
            RiskLevel.LOW: 700,
            RiskLevel.MEDIUM: 600,
            RiskLevel.HIGH: 500,
            RiskLevel.VERY_HIGH: 0
        }
        
        # 信用等级阈值
        self.grade_thresholds = {
            CreditGrade.AAA: 800,
            CreditGrade.AA: 750,
            CreditGrade.A: 700,
            CreditGrade.BBB: 650,
            CreditGrade.BB: 600,
            CreditGrade.B: 550,
            CreditGrade.CCC: 500,
            CreditGrade.CC: 450,
            CreditGrade.C: 400,
            CreditGrade.D: 0
        }
    
    async def calculate_credit_score(self, request: CreditScoreRequest) -> CreditScoreResult:
        """计算信用评分"""
        try:
            # 根据用户类型选择权重
            weights = (self.artist_weights if request.user_type == UserType.ARTIST 
                      else self.investor_weights)
            
            # 计算各部分评分
            financial_score = self._calculate_financial_score(request.financial_history)
            blockchain_score = self._calculate_blockchain_score(request.blockchain_metrics)
            social_score = self._calculate_social_score(request.social_metrics)
            
            # 特定用户类型评分
            if request.user_type == UserType.ARTIST and request.artist_metrics:
                specific_score = self._calculate_artist_score(request.artist_metrics)
            elif request.user_type == UserType.INVESTOR and request.investor_metrics:
                specific_score = self._calculate_investor_score(request.investor_metrics)
            else:
                specific_score = 500  # 默认中等评分
            
            # 加权计算总评分
            total_score = (
                financial_score * weights['financial_history'] +
                specific_score * weights.get('artist_metrics', weights.get('investor_metrics', 0)) +
                blockchain_score * weights['blockchain_metrics'] +
                social_score * weights['social_metrics']
            )
            
            # 确保评分在有效范围内
            credit_score = max(300, min(850, int(total_score)))
            
            # 确定信用等级和风险级别
            credit_grade = self._determine_credit_grade(credit_score)
            risk_level = self._determine_risk_level(credit_score)
            
            # 计算置信度
            confidence = self._calculate_confidence(request)
            
            # 评分分解
            score_breakdown = {
                'financial_history': financial_score,
                'specific_metrics': specific_score,
                'blockchain_metrics': blockchain_score,
                'social_metrics': social_score,
                'weighted_total': credit_score
            }
            
            # 分析风险因素和积极因素
            risk_factors = self._analyze_risk_factors(request, credit_score)
            positive_factors = self._analyze_positive_factors(request, credit_score)
            
            # 生成建议
            recommendations = self._generate_recommendations(request, credit_score)
            
            # 下次审查日期
            next_review = datetime.now() + timedelta(days=90)  # 3个月后
            
            return CreditScoreResult(
                user_id=request.user_id,
                credit_score=credit_score,
                credit_grade=credit_grade,
                risk_level=risk_level,
                confidence=confidence,
                score_breakdown=score_breakdown,
                risk_factors=risk_factors,
                positive_factors=positive_factors,
                recommendations=recommendations,
                next_review_date=next_review,
                created_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Credit score calculation error: {e}")
            raise HTTPException(status_code=500, detail=f"Credit scoring failed: {str(e)}")
    
    def _calculate_financial_score(self, financial: FinancialHistory) -> float:
        """计算财务评分"""
        score = 500  # 基础分
        
        # 收益稳定性
        if financial.total_revenue > 0:
            score += min(100, financial.total_revenue / 10000)  # 每1万收益+1分，最多100分
        
        # 支付历史
        if financial.total_transactions > 0:
            payment_ratio = 1 - (financial.defaults + financial.late_payments) / financial.total_transactions
            score += payment_ratio * 150  # 最多150分
        
        # 交易规模
        if financial.average_transaction_size > 0:
            score += min(50, financial.average_transaction_size / 100)  # 每100单位+1分，最多50分
        
        return max(300, min(850, score))
    
    def _calculate_artist_score(self, artist: ArtistMetrics) -> float:
        """计算艺术家评分"""
        score = 500  # 基础分
        
        # 流媒体表现
        if artist.total_streams > 0:
            score += min(100, np.log10(artist.total_streams) * 10)  # 对数缩放
        
        # 粉丝基础
        if artist.follower_count > 0:
            score += min(80, np.log10(artist.follower_count) * 15)
        
        # 参与度
        score += artist.engagement_rate * 50  # 最多50分
        
        # 发布频率
        score += min(30, artist.release_frequency * 10)  # 每月发布+10分，最多30分
        
        # 合作和奖项
        score += min(40, artist.collaboration_count * 2)  # 每次合作+2分
        score += min(50, artist.awards_count * 10)  # 每个奖项+10分
        
        return max(300, min(850, score))
    
    def _calculate_investor_score(self, investor: InvestorMetrics) -> float:
        """计算投资者评分"""
        score = 500  # 基础分
        
        # 投资规模
        if investor.total_invested > 0:
            score += min(100, investor.total_invested / 50000)  # 每5万投资+1分
        
        # 投资组合
        score += min(50, investor.portfolio_size * 2)  # 每个投资项目+2分
        
        # 成功率
        if investor.successful_investments + investor.failed_investments > 0:
            success_rate = investor.successful_investments / (investor.successful_investments + investor.failed_investments)
            score += success_rate * 100  # 最多100分
        
        # ROI表现
        if investor.average_roi > 0:
            score += min(80, investor.average_roi * 100)  # ROI转换为分数
        
        # 多样化
        score += investor.diversification_score * 70  # 最多70分
        
        return max(300, min(850, score))
    
    def _calculate_blockchain_score(self, blockchain: BlockchainMetrics) -> float:
        """计算区块链评分"""
        score = 500  # 基础分
        
        # 钱包年龄
        score += min(50, blockchain.wallet_age / 10)  # 每10天+1分，最多50分
        
        # 交易活跃度
        if blockchain.transaction_count > 0:
            score += min(80, np.log10(blockchain.transaction_count) * 20)
        
        # 交易量
        if blockchain.total_volume > 0:
            score += min(70, np.log10(blockchain.total_volume) * 15)
        
        # DeFi参与
        if blockchain.defi_participation:
            score += 30
        
        # 治理参与
        score += min(40, blockchain.governance_participation * 5)
        
        # 质押
        if blockchain.staking_amount > 0:
            score += min(30, blockchain.staking_amount / 1000)
        
        return max(300, min(850, score))
    
    def _calculate_social_score(self, social: SocialMetrics) -> float:
        """计算社交评分"""
        score = 500  # 基础分
        
        # 社交媒体关注者
        total_followers = sum(social.social_media_followers.values())
        if total_followers > 0:
            score += min(80, np.log10(total_followers) * 15)
        
        # 参与度
        score += social.social_engagement_rate * 60  # 最多60分
        
        # 社区声誉
        score += social.community_reputation * 50  # 最多50分
        
        # 认证账户
        score += social.verified_accounts * 20  # 每个认证+20分
        
        # 负面情绪惩罚
        score -= social.negative_sentiment_ratio * 100  # 负面情绪扣分
        
        return max(300, min(850, score))
    
    def _determine_credit_grade(self, score: int) -> CreditGrade:
        """确定信用等级"""
        for grade, threshold in self.grade_thresholds.items():
            if score >= threshold:
                return grade
        return CreditGrade.D
    
    def _determine_risk_level(self, score: int) -> RiskLevel:
        """确定风险级别"""
        for risk, threshold in self.risk_thresholds.items():
            if score >= threshold:
                return risk
        return RiskLevel.VERY_HIGH
    
    def _calculate_confidence(self, request: CreditScoreRequest) -> float:
        """计算置信度"""
        confidence = 0.5  # 基础置信度
        
        # 数据完整性
        if request.financial_history.total_transactions > 10:
            confidence += 0.2
        
        if request.blockchain_metrics.transaction_count > 50:
            confidence += 0.15
        
        if request.social_metrics.social_media_followers:
            confidence += 0.1
        
        # 用户类型特定数据
        if request.user_type == UserType.ARTIST and request.artist_metrics:
            if request.artist_metrics.total_streams > 1000:
                confidence += 0.05
        
        return min(1.0, confidence)
    
    def _analyze_risk_factors(self, request: CreditScoreRequest, score: int) -> List[str]:
        """分析风险因素"""
        risks = []
        
        # 财务风险
        if request.financial_history.defaults > 0:
            risks.append("History of payment defaults")
        
        if request.financial_history.late_payments > 5:
            risks.append("Frequent late payments")
        
        if request.financial_history.total_revenue < 1000:
            risks.append("Low revenue history")
        
        # 区块链风险
        if request.blockchain_metrics.wallet_age < 30:
            risks.append("New wallet address")
        
        if request.blockchain_metrics.transaction_count < 10:
            risks.append("Limited blockchain activity")
        
        # 社交风险
        if request.social_metrics.negative_sentiment_ratio > 0.3:
            risks.append("High negative sentiment")
        
        # 评分相关风险
        if score < 500:
            risks.append("Below average credit score")
        
        return risks
    
    def _analyze_positive_factors(self, request: CreditScoreRequest, score: int) -> List[str]:
        """分析积极因素"""
        positives = []
        
        # 财务积极因素
        if request.financial_history.defaults == 0:
            positives.append("No payment defaults")
        
        if request.financial_history.total_revenue > 10000:
            positives.append("Strong revenue history")
        
        # 区块链积极因素
        if request.blockchain_metrics.defi_participation:
            positives.append("Active DeFi participant")
        
        if request.blockchain_metrics.governance_participation > 5:
            positives.append("Active in governance")
        
        # 社交积极因素
        if request.social_metrics.verified_accounts > 0:
            positives.append("Verified social media accounts")
        
        if request.social_metrics.community_reputation > 0.8:
            positives.append("Strong community reputation")
        
        # 评分相关积极因素
        if score > 700:
            positives.append("Excellent credit score")
        elif score > 600:
            positives.append("Good credit score")
        
        return positives
    
    def _generate_recommendations(self, request: CreditScoreRequest, score: int) -> List[str]:
        """生成改进建议"""
        recommendations = []
        
        if score < 600:
            recommendations.append("Focus on building consistent payment history")
            recommendations.append("Increase transaction volume gradually")
        
        if request.blockchain_metrics.transaction_count < 50:
            recommendations.append("Increase blockchain activity and engagement")
        
        if not request.blockchain_metrics.defi_participation:
            recommendations.append("Consider participating in DeFi protocols")
        
        if request.social_metrics.negative_sentiment_ratio > 0.2:
            recommendations.append("Improve community engagement and reputation")
        
        if request.user_type == UserType.ARTIST and request.artist_metrics:
            if request.artist_metrics.engagement_rate < 0.1:
                recommendations.append("Increase fan engagement and interaction")
            if request.artist_metrics.release_frequency < 1:
                recommendations.append("Maintain regular content release schedule")
        
        return recommendations

# 全局模型实例
credit_model = CreditScoringModel()

@router.post("/score", response_model=CreditScoreResult)
async def calculate_credit_score(request: CreditScoreRequest):
    """
    计算用户信用评分
    
    - **user_id**: 用户ID
    - **user_type**: 用户类型（艺术家/投资者/厂牌/制作人）
    - **financial_history**: 财务历史
    - **blockchain_metrics**: 区块链指标
    - **social_metrics**: 社交指标
    - **artist_metrics**: 艺术家指标（艺术家用户）
    - **investor_metrics**: 投资者指标（投资者用户）
    """
    try:
        logger.info(f"Calculating credit score for user: {request.user_id}")
        result = await credit_model.calculate_credit_score(request)
        logger.info(f"Credit score calculated: {result.credit_score} ({result.credit_grade})")
        return result
    except Exception as e:
        logger.error(f"Credit score calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/score/{user_id}")
async def get_credit_score(
    user_id: str,
    include_history: bool = Query(default=False, description="包含历史评分")
):
    """
    获取用户当前信用评分
    
    - **user_id**: 用户ID
    - **include_history**: 是否包含历史评分
    """
    try:
        # 模拟从数据库获取评分
        await asyncio.sleep(0.1)
        
        # 生成模拟评分数据
        score = np.random.randint(400, 800)
        grade = credit_model._determine_credit_grade(score)
        risk = credit_model._determine_risk_level(score)
        
        result = {
            "user_id": user_id,
            "credit_score": score,
            "credit_grade": grade,
            "risk_level": risk,
            "last_updated": datetime.now().isoformat(),
            "next_review": (datetime.now() + timedelta(days=90)).isoformat()
        }
        
        if include_history:
            # 生成模拟历史数据
            history = []
            for i in range(12):  # 12个月历史
                date = datetime.now() - timedelta(days=30 * i)
                historical_score = score + np.random.randint(-50, 50)
                historical_score = max(300, min(850, historical_score))
                
                history.append({
                    "date": date.isoformat(),
                    "score": historical_score,
                    "grade": credit_model._determine_credit_grade(historical_score)
                })
            
            result["score_history"] = history
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Get credit score failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_credit_profile(
    user_id: str = Body(...),
    analysis_type: str = Body(default="comprehensive", description="分析类型"),
    time_period: int = Body(default=365, description="分析时间段（天）")
) -> CreditAnalysis:
    """
    深度信用分析
    
    - **user_id**: 用户ID
    - **analysis_type**: 分析类型
    - **time_period**: 分析时间段
    """
    try:
        # 模拟深度分析
        await asyncio.sleep(0.3)
        
        # 生成分析结果
        analysis = CreditAnalysis(
            payment_reliability=np.random.uniform(0.6, 0.95),
            revenue_stability=np.random.uniform(0.5, 0.9),
            growth_potential=np.random.uniform(0.4, 0.85),
            market_position=np.random.uniform(0.3, 0.8),
            diversification=np.random.uniform(0.2, 0.9),
            liquidity=np.random.uniform(0.4, 0.95),
            overall_assessment="Based on comprehensive analysis, the user shows strong financial fundamentals with moderate growth potential."
        )
        
        return analysis
        
    except Exception as e:
        logger.error(f"Credit analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/benchmark/{user_type}")
async def get_credit_benchmark(
    user_type: UserType,
    region: str = Query(default="global", description="地区"),
    genre: Optional[str] = Query(default=None, description="音乐流派（艺术家）")
):
    """
    获取信用评分基准数据
    
    - **user_type**: 用户类型
    - **region**: 地区
    - **genre**: 音乐流派（艺术家用户）
    """
    try:
        # 生成基准数据
        benchmark_data = {
            "user_type": user_type,
            "region": region,
            "average_score": np.random.randint(580, 720),
            "median_score": np.random.randint(570, 710),
            "score_distribution": {
                "excellent (750+)": np.random.uniform(0.15, 0.25),
                "good (700-749)": np.random.uniform(0.20, 0.30),
                "fair (650-699)": np.random.uniform(0.25, 0.35),
                "poor (600-649)": np.random.uniform(0.15, 0.25),
                "very_poor (<600)": np.random.uniform(0.05, 0.15)
            },
            "risk_distribution": {
                RiskLevel.LOW: np.random.uniform(0.20, 0.35),
                RiskLevel.MEDIUM: np.random.uniform(0.30, 0.45),
                RiskLevel.HIGH: np.random.uniform(0.15, 0.30),
                RiskLevel.VERY_HIGH: np.random.uniform(0.05, 0.15)
            },
            "trends": {
                "monthly_change": np.random.uniform(-2, 5),
                "yearly_change": np.random.uniform(-10, 25)
            }
        }
        
        if genre and user_type == UserType.ARTIST:
            benchmark_data["genre"] = genre
            benchmark_data["genre_average"] = np.random.randint(560, 740)
        
        return {
            "success": True,
            "data": benchmark_data
        }
        
    except Exception as e:
        logger.error(f"Get benchmark failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-score")
async def batch_credit_scoring(
    requests: List[CreditScoreRequest] = Body(..., description="批量评分请求")
):
    """
    批量信用评分
    
    - **requests**: 评分请求列表
    """
    try:
        if len(requests) > 100:  # 限制批量大小
            raise HTTPException(status_code=400, detail="Batch size too large (max 100)")
        
        results = []
        for i, request in enumerate(requests):
            try:
                score_result = await credit_model.calculate_credit_score(request)
                results.append({
                    "index": i,
                    "success": True,
                    "result": score_result
                })
            except Exception as e:
                results.append({
                    "index": i,
                    "success": False,
                    "error": str(e)
                })
        
        successful_scores = sum(1 for r in results if r["success"])
        
        return {
            "success": True,
            "message": f"Processed {len(requests)} requests, {successful_scores} successful",
            "results": results,
            "summary": {
                "total_requests": len(requests),
                "successful": successful_scores,
                "failed": len(requests) - successful_scores,
                "average_score": np.mean([
                    r["result"].credit_score for r in results if r["success"]
                ]) if successful_scores > 0 else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Batch credit scoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/info")
async def get_model_info():
    """
    获取信用评分模型信息
    """
    return {
        "success": True,
        "data": {
            "model_name": "MantleMusic Credit Scoring Model v1.0",
            "score_range": "300-850",
            "supported_user_types": [t.value for t in UserType],
            "risk_levels": [r.value for r in RiskLevel],
            "credit_grades": [g.value for g in CreditGrade],
            "update_frequency": "Real-time",
            "factors": {
                "financial_history": "35-40%",
                "user_specific_metrics": "25-30%",
                "blockchain_activity": "20%",
                "social_reputation": "10-15%"
            },
            "last_updated": datetime.now().isoformat()
        }
    }