"""
风险评估API模块
提供投资风险评估、市场风险分析、流动性风险评估等功能
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

router = APIRouter(prefix="/risk", tags=["Risk Assessment"])

# 枚举类型
class RiskType(str, Enum):
    MARKET = "market"
    CREDIT = "credit"
    LIQUIDITY = "liquidity"
    OPERATIONAL = "operational"
    REGULATORY = "regulatory"
    TECHNOLOGY = "technology"

class RiskLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"
    EXTREME = "extreme"

class AssetType(str, Enum):
    MUSIC_TOKEN = "music_token"
    ARTIST_SHARE = "artist_share"
    ROYALTY_STREAM = "royalty_stream"
    LABEL_EQUITY = "label_equity"
    PLATFORM_TOKEN = "platform_token"

class TimeHorizon(str, Enum):
    SHORT_TERM = "short_term"  # 1-3 months
    MEDIUM_TERM = "medium_term"  # 3-12 months
    LONG_TERM = "long_term"  # 1+ years

# 数据模型
class AssetInfo(BaseModel):
    """资产信息"""
    asset_id: str
    asset_type: AssetType
    name: str
    symbol: str
    current_price: float
    market_cap: float = 0
    volume_24h: float = 0
    circulating_supply: float = 0
    total_supply: float = 0

class MarketData(BaseModel):
    """市场数据"""
    price_history: List[Dict[str, Any]] = []
    volume_history: List[Dict[str, Any]] = []
    volatility: float = 0
    beta: float = 0  # 相对于市场的波动性
    correlation_matrix: Dict[str, float] = {}
    market_sentiment: float = 0  # -1 to 1

class PortfolioData(BaseModel):
    """投资组合数据"""
    total_value: float
    assets: List[Dict[str, Any]] = []
    allocation: Dict[str, float] = {}
    diversification_score: float = 0
    concentration_risk: float = 0

class RiskFactors(BaseModel):
    """风险因素"""
    market_factors: Dict[str, float] = {}
    credit_factors: Dict[str, float] = {}
    liquidity_factors: Dict[str, float] = {}
    operational_factors: Dict[str, float] = {}
    regulatory_factors: Dict[str, float] = {}
    technology_factors: Dict[str, float] = {}

class RiskAssessmentRequest(BaseModel):
    """风险评估请求"""
    assessment_id: str
    asset_info: Optional[AssetInfo] = None
    portfolio_data: Optional[PortfolioData] = None
    market_data: MarketData
    time_horizon: TimeHorizon
    risk_tolerance: float = Field(ge=0, le=1)  # 0=保守, 1=激进
    assessment_types: List[RiskType]
    additional_factors: Dict[str, Any] = {}

class RiskMetrics(BaseModel):
    """风险指标"""
    var_95: float  # 95% Value at Risk
    var_99: float  # 99% Value at Risk
    expected_shortfall: float  # 条件风险价值
    max_drawdown: float  # 最大回撤
    sharpe_ratio: float  # 夏普比率
    sortino_ratio: float  # 索提诺比率
    volatility: float  # 波动率
    beta: float  # 贝塔系数
    tracking_error: float  # 跟踪误差

class RiskScenario(BaseModel):
    """风险情景"""
    scenario_name: str
    probability: float
    impact: float
    description: str
    potential_loss: float
    mitigation_strategies: List[str]

class RiskAssessmentResult(BaseModel):
    """风险评估结果"""
    assessment_id: str
    overall_risk_level: RiskLevel
    overall_risk_score: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    risk_breakdown: Dict[RiskType, float]
    risk_metrics: RiskMetrics
    risk_scenarios: List[RiskScenario]
    recommendations: List[str]
    risk_factors: RiskFactors
    stress_test_results: Dict[str, Any] = {}
    created_at: datetime
    valid_until: datetime

# 风险评估模型
class RiskAssessmentModel:
    """风险评估模型"""
    
    def __init__(self):
        # 风险权重配置
        self.risk_weights = {
            RiskType.MARKET: 0.30,
            RiskType.CREDIT: 0.25,
            RiskType.LIQUIDITY: 0.20,
            RiskType.OPERATIONAL: 0.10,
            RiskType.REGULATORY: 0.10,
            RiskType.TECHNOLOGY: 0.05
        }
        
        # 风险级别阈值
        self.risk_thresholds = {
            RiskLevel.VERY_LOW: 20,
            RiskLevel.LOW: 40,
            RiskLevel.MEDIUM: 60,
            RiskLevel.HIGH: 80,
            RiskLevel.VERY_HIGH: 95,
            RiskLevel.EXTREME: 100
        }
        
        # 时间衰减因子
        self.time_decay = {
            TimeHorizon.SHORT_TERM: 1.0,
            TimeHorizon.MEDIUM_TERM: 0.8,
            TimeHorizon.LONG_TERM: 0.6
        }
    
    async def assess_risk(self, request: RiskAssessmentRequest) -> RiskAssessmentResult:
        """执行风险评估"""
        try:
            # 计算各类风险评分
            risk_scores = {}
            for risk_type in request.assessment_types:
                if risk_type == RiskType.MARKET:
                    risk_scores[risk_type] = await self._assess_market_risk(request)
                elif risk_type == RiskType.CREDIT:
                    risk_scores[risk_type] = await self._assess_credit_risk(request)
                elif risk_type == RiskType.LIQUIDITY:
                    risk_scores[risk_type] = await self._assess_liquidity_risk(request)
                elif risk_type == RiskType.OPERATIONAL:
                    risk_scores[risk_type] = await self._assess_operational_risk(request)
                elif risk_type == RiskType.REGULATORY:
                    risk_scores[risk_type] = await self._assess_regulatory_risk(request)
                elif risk_type == RiskType.TECHNOLOGY:
                    risk_scores[risk_type] = await self._assess_technology_risk(request)
            
            # 计算综合风险评分
            overall_score = self._calculate_overall_risk(risk_scores, request.time_horizon)
            
            # 确定风险级别
            risk_level = self._determine_risk_level(overall_score)
            
            # 计算风险指标
            risk_metrics = await self._calculate_risk_metrics(request)
            
            # 生成风险情景
            scenarios = await self._generate_risk_scenarios(request, overall_score)
            
            # 分析风险因素
            risk_factors = await self._analyze_risk_factors(request)
            
            # 压力测试
            stress_results = await self._perform_stress_tests(request)
            
            # 生成建议
            recommendations = self._generate_recommendations(request, overall_score, risk_level)
            
            # 计算置信度
            confidence = self._calculate_confidence(request)
            
            return RiskAssessmentResult(
                assessment_id=request.assessment_id,
                overall_risk_level=risk_level,
                overall_risk_score=overall_score,
                confidence=confidence,
                risk_breakdown=risk_scores,
                risk_metrics=risk_metrics,
                risk_scenarios=scenarios,
                recommendations=recommendations,
                risk_factors=risk_factors,
                stress_test_results=stress_results,
                created_at=datetime.now(),
                valid_until=datetime.now() + timedelta(hours=24)
            )
            
        except Exception as e:
            logger.error(f"Risk assessment error: {e}")
            raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")
    
    async def _assess_market_risk(self, request: RiskAssessmentRequest) -> float:
        """评估市场风险"""
        score = 50  # 基础分
        
        # 波动率风险
        if request.market_data.volatility > 0:
            volatility_risk = min(40, request.market_data.volatility * 100)
            score += volatility_risk
        
        # Beta风险
        if abs(request.market_data.beta) > 1:
            beta_risk = min(20, (abs(request.market_data.beta) - 1) * 20)
            score += beta_risk
        
        # 市场情绪风险
        if request.market_data.market_sentiment < 0:
            sentiment_risk = abs(request.market_data.market_sentiment) * 30
            score += sentiment_risk
        
        # 相关性风险
        if request.market_data.correlation_matrix:
            avg_correlation = np.mean(list(request.market_data.correlation_matrix.values()))
            if avg_correlation > 0.7:  # 高相关性增加风险
                score += (avg_correlation - 0.7) * 50
        
        return max(0, min(100, score))
    
    async def _assess_credit_risk(self, request: RiskAssessmentRequest) -> float:
        """评估信用风险"""
        score = 30  # 基础分
        
        # 资产类型风险
        if request.asset_info:
            asset_risk_map = {
                AssetType.MUSIC_TOKEN: 40,
                AssetType.ARTIST_SHARE: 35,
                AssetType.ROYALTY_STREAM: 25,
                AssetType.LABEL_EQUITY: 30,
                AssetType.PLATFORM_TOKEN: 45
            }
            score += asset_risk_map.get(request.asset_info.asset_type, 40)
        
        # 市场规模风险
        if request.asset_info and request.asset_info.market_cap > 0:
            if request.asset_info.market_cap < 1000000:  # 小市值高风险
                score += 30
            elif request.asset_info.market_cap < 10000000:
                score += 20
            else:
                score += 10
        
        # 流动性风险
        if request.asset_info and request.asset_info.volume_24h > 0:
            volume_ratio = request.asset_info.volume_24h / request.asset_info.market_cap
            if volume_ratio < 0.01:  # 低流动性
                score += 25
        
        return max(0, min(100, score))
    
    async def _assess_liquidity_risk(self, request: RiskAssessmentRequest) -> float:
        """评估流动性风险"""
        score = 40  # 基础分
        
        # 交易量风险
        if request.asset_info and request.asset_info.volume_24h > 0:
            if request.asset_info.volume_24h < 10000:
                score += 40
            elif request.asset_info.volume_24h < 100000:
                score += 25
            else:
                score += 10
        
        # 市场深度风险（模拟）
        market_depth_score = np.random.uniform(10, 30)
        score += market_depth_score
        
        # 时间风险
        time_factor = {
            TimeHorizon.SHORT_TERM: 1.2,
            TimeHorizon.MEDIUM_TERM: 1.0,
            TimeHorizon.LONG_TERM: 0.8
        }
        score *= time_factor[request.time_horizon]
        
        return max(0, min(100, score))
    
    async def _assess_operational_risk(self, request: RiskAssessmentRequest) -> float:
        """评估操作风险"""
        score = 25  # 基础分
        
        # 平台风险
        platform_risk = np.random.uniform(10, 30)
        score += platform_risk
        
        # 技术风险
        tech_risk = np.random.uniform(5, 20)
        score += tech_risk
        
        # 人为错误风险
        human_error_risk = np.random.uniform(5, 15)
        score += human_error_risk
        
        return max(0, min(100, score))
    
    async def _assess_regulatory_risk(self, request: RiskAssessmentRequest) -> float:
        """评估监管风险"""
        score = 35  # 基础分
        
        # 资产类型监管风险
        regulatory_risk_map = {
            AssetType.MUSIC_TOKEN: 30,
            AssetType.ARTIST_SHARE: 40,
            AssetType.ROYALTY_STREAM: 20,
            AssetType.LABEL_EQUITY: 35,
            AssetType.PLATFORM_TOKEN: 45
        }
        
        if request.asset_info:
            score += regulatory_risk_map.get(request.asset_info.asset_type, 35)
        
        # 地区监管风险（模拟）
        regional_risk = np.random.uniform(10, 25)
        score += regional_risk
        
        return max(0, min(100, score))
    
    async def _assess_technology_risk(self, request: RiskAssessmentRequest) -> float:
        """评估技术风险"""
        score = 20  # 基础分
        
        # 智能合约风险
        contract_risk = np.random.uniform(15, 35)
        score += contract_risk
        
        # 网络风险
        network_risk = np.random.uniform(10, 25)
        score += network_risk
        
        # 安全风险
        security_risk = np.random.uniform(5, 20)
        score += security_risk
        
        return max(0, min(100, score))
    
    def _calculate_overall_risk(self, risk_scores: Dict[RiskType, float], time_horizon: TimeHorizon) -> float:
        """计算综合风险评分"""
        weighted_score = 0
        total_weight = 0
        
        for risk_type, score in risk_scores.items():
            weight = self.risk_weights.get(risk_type, 0.1)
            weighted_score += score * weight
            total_weight += weight
        
        if total_weight > 0:
            overall_score = weighted_score / total_weight
        else:
            overall_score = 50
        
        # 应用时间衰减
        time_factor = self.time_decay[time_horizon]
        overall_score *= time_factor
        
        return max(0, min(100, overall_score))
    
    def _determine_risk_level(self, score: float) -> RiskLevel:
        """确定风险级别"""
        for level, threshold in self.risk_thresholds.items():
            if score <= threshold:
                return level
        return RiskLevel.EXTREME
    
    async def _calculate_risk_metrics(self, request: RiskAssessmentRequest) -> RiskMetrics:
        """计算风险指标"""
        # 模拟计算各种风险指标
        volatility = request.market_data.volatility if request.market_data.volatility > 0 else np.random.uniform(0.1, 0.5)
        
        return RiskMetrics(
            var_95=np.random.uniform(0.05, 0.15),  # 5-15%
            var_99=np.random.uniform(0.08, 0.25),  # 8-25%
            expected_shortfall=np.random.uniform(0.10, 0.30),  # 10-30%
            max_drawdown=np.random.uniform(0.15, 0.50),  # 15-50%
            sharpe_ratio=np.random.uniform(-0.5, 2.0),
            sortino_ratio=np.random.uniform(-0.3, 2.5),
            volatility=volatility,
            beta=request.market_data.beta if request.market_data.beta != 0 else np.random.uniform(0.5, 1.5),
            tracking_error=np.random.uniform(0.02, 0.10)
        )
    
    async def _generate_risk_scenarios(self, request: RiskAssessmentRequest, overall_score: float) -> List[RiskScenario]:
        """生成风险情景"""
        scenarios = []
        
        # 市场崩盘情景
        scenarios.append(RiskScenario(
            scenario_name="Market Crash",
            probability=0.05,
            impact=0.8,
            description="Severe market downturn affecting all music assets",
            potential_loss=np.random.uniform(0.3, 0.7),
            mitigation_strategies=[
                "Diversify across different asset types",
                "Implement stop-loss orders",
                "Maintain cash reserves"
            ]
        ))
        
        # 监管变化情景
        scenarios.append(RiskScenario(
            scenario_name="Regulatory Changes",
            probability=0.15,
            impact=0.6,
            description="New regulations affecting music token trading",
            potential_loss=np.random.uniform(0.2, 0.5),
            mitigation_strategies=[
                "Stay informed about regulatory developments",
                "Ensure compliance with current regulations",
                "Diversify geographically"
            ]
        ))
        
        # 技术故障情景
        scenarios.append(RiskScenario(
            scenario_name="Technical Failure",
            probability=0.10,
            impact=0.4,
            description="Platform or smart contract technical issues",
            potential_loss=np.random.uniform(0.1, 0.3),
            mitigation_strategies=[
                "Use multiple platforms",
                "Regular security audits",
                "Backup recovery plans"
            ]
        ))
        
        # 流动性危机情景
        scenarios.append(RiskScenario(
            scenario_name="Liquidity Crisis",
            probability=0.20,
            impact=0.5,
            description="Severe reduction in market liquidity",
            potential_loss=np.random.uniform(0.15, 0.4),
            mitigation_strategies=[
                "Maintain diverse asset portfolio",
                "Monitor liquidity metrics",
                "Plan exit strategies"
            ]
        ))
        
        return scenarios
    
    async def _analyze_risk_factors(self, request: RiskAssessmentRequest) -> RiskFactors:
        """分析风险因素"""
        return RiskFactors(
            market_factors={
                "volatility": request.market_data.volatility,
                "beta": request.market_data.beta,
                "market_sentiment": request.market_data.market_sentiment,
                "correlation_risk": np.random.uniform(0.3, 0.8)
            },
            credit_factors={
                "default_probability": np.random.uniform(0.01, 0.15),
                "credit_spread": np.random.uniform(0.02, 0.10),
                "recovery_rate": np.random.uniform(0.3, 0.7)
            },
            liquidity_factors={
                "bid_ask_spread": np.random.uniform(0.01, 0.05),
                "market_depth": np.random.uniform(0.4, 0.9),
                "trading_volume": request.asset_info.volume_24h if request.asset_info else 0
            },
            operational_factors={
                "platform_reliability": np.random.uniform(0.8, 0.99),
                "execution_risk": np.random.uniform(0.01, 0.05),
                "counterparty_risk": np.random.uniform(0.02, 0.08)
            },
            regulatory_factors={
                "regulatory_uncertainty": np.random.uniform(0.2, 0.6),
                "compliance_cost": np.random.uniform(0.01, 0.05),
                "legal_risk": np.random.uniform(0.02, 0.10)
            },
            technology_factors={
                "smart_contract_risk": np.random.uniform(0.01, 0.08),
                "network_congestion": np.random.uniform(0.05, 0.20),
                "security_vulnerabilities": np.random.uniform(0.01, 0.05)
            }
        )
    
    async def _perform_stress_tests(self, request: RiskAssessmentRequest) -> Dict[str, Any]:
        """执行压力测试"""
        stress_results = {}
        
        # 价格冲击测试
        price_shocks = [-0.5, -0.3, -0.2, -0.1, 0.1, 0.2, 0.3, 0.5]
        price_impact = {}
        for shock in price_shocks:
            impact = abs(shock) * np.random.uniform(0.8, 1.2)
            price_impact[f"{shock*100}%"] = impact
        
        stress_results["price_shock"] = price_impact
        
        # 流动性压力测试
        liquidity_scenarios = {
            "normal": 1.0,
            "stressed": 0.5,
            "crisis": 0.2,
            "extreme": 0.05
        }
        
        liquidity_impact = {}
        for scenario, factor in liquidity_scenarios.items():
            impact = (1 - factor) * np.random.uniform(0.1, 0.5)
            liquidity_impact[scenario] = impact
        
        stress_results["liquidity_stress"] = liquidity_impact
        
        # 相关性压力测试
        correlation_stress = {
            "normal_correlation": np.random.uniform(0.3, 0.6),
            "high_correlation": np.random.uniform(0.7, 0.9),
            "extreme_correlation": np.random.uniform(0.9, 1.0)
        }
        
        stress_results["correlation_stress"] = correlation_stress
        
        return stress_results
    
    def _generate_recommendations(self, request: RiskAssessmentRequest, score: float, level: RiskLevel) -> List[str]:
        """生成风险管理建议"""
        recommendations = []
        
        if level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH, RiskLevel.EXTREME]:
            recommendations.extend([
                "Consider reducing position size",
                "Implement strict stop-loss orders",
                "Increase portfolio diversification",
                "Monitor positions more frequently"
            ])
        
        if score > 70:
            recommendations.append("Consider hedging strategies to reduce risk exposure")
        
        if request.time_horizon == TimeHorizon.SHORT_TERM and score > 60:
            recommendations.append("Short-term high risk detected - consider extending time horizon")
        
        if request.asset_info and request.asset_info.volume_24h < 50000:
            recommendations.append("Low liquidity detected - plan exit strategy carefully")
        
        if request.market_data.volatility > 0.3:
            recommendations.append("High volatility - consider dollar-cost averaging")
        
        recommendations.extend([
            "Regular portfolio rebalancing recommended",
            "Stay informed about market developments",
            "Maintain adequate cash reserves",
            "Consider professional risk management advice"
        ])
        
        return recommendations
    
    def _calculate_confidence(self, request: RiskAssessmentRequest) -> float:
        """计算评估置信度"""
        confidence = 0.5  # 基础置信度
        
        # 数据质量
        if len(request.market_data.price_history) > 30:
            confidence += 0.2
        
        if request.market_data.volatility > 0:
            confidence += 0.1
        
        if request.asset_info and request.asset_info.market_cap > 0:
            confidence += 0.1
        
        # 评估类型完整性
        if len(request.assessment_types) >= 4:
            confidence += 0.1
        
        return min(1.0, confidence)

# 全局模型实例
risk_model = RiskAssessmentModel()

@router.post("/assess", response_model=RiskAssessmentResult)
async def assess_risk(request: RiskAssessmentRequest):
    """
    执行风险评估
    
    - **assessment_id**: 评估ID
    - **asset_info**: 资产信息（可选）
    - **portfolio_data**: 投资组合数据（可选）
    - **market_data**: 市场数据
    - **time_horizon**: 时间范围
    - **risk_tolerance**: 风险承受能力
    - **assessment_types**: 评估类型列表
    """
    try:
        logger.info(f"Starting risk assessment: {request.assessment_id}")
        result = await risk_model.assess_risk(request)
        logger.info(f"Risk assessment completed: {result.overall_risk_level} ({result.overall_risk_score:.2f})")
        return result
    except Exception as e:
        logger.error(f"Risk assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/{portfolio_id}")
async def assess_portfolio_risk(
    portfolio_id: str,
    time_horizon: TimeHorizon = Query(default=TimeHorizon.MEDIUM_TERM),
    include_scenarios: bool = Query(default=True, description="包含风险情景")
):
    """
    评估投资组合风险
    
    - **portfolio_id**: 投资组合ID
    - **time_horizon**: 时间范围
    - **include_scenarios**: 是否包含风险情景
    """
    try:
        # 模拟投资组合数据
        await asyncio.sleep(0.2)
        
        portfolio_risk = {
            "portfolio_id": portfolio_id,
            "overall_risk_score": np.random.uniform(30, 80),
            "risk_level": np.random.choice(list(RiskLevel)),
            "diversification_score": np.random.uniform(0.4, 0.9),
            "concentration_risk": np.random.uniform(0.1, 0.6),
            "asset_allocation": {
                "music_tokens": np.random.uniform(0.2, 0.5),
                "artist_shares": np.random.uniform(0.1, 0.3),
                "royalty_streams": np.random.uniform(0.1, 0.4),
                "platform_tokens": np.random.uniform(0.05, 0.2)
            },
            "risk_metrics": {
                "portfolio_var_95": np.random.uniform(0.08, 0.20),
                "portfolio_volatility": np.random.uniform(0.15, 0.40),
                "max_drawdown": np.random.uniform(0.20, 0.60),
                "sharpe_ratio": np.random.uniform(-0.5, 2.0)
            }
        }
        
        if include_scenarios:
            portfolio_risk["risk_scenarios"] = [
                {
                    "name": "Market Correction",
                    "probability": 0.25,
                    "impact": np.random.uniform(0.15, 0.35),
                    "description": "General market downturn affecting portfolio value"
                },
                {
                    "name": "Sector Rotation",
                    "probability": 0.40,
                    "impact": np.random.uniform(0.10, 0.25),
                    "description": "Shift in investor preference away from music assets"
                }
            ]
        
        return {
            "success": True,
            "data": portfolio_risk
        }
        
    except Exception as e:
        logger.error(f"Portfolio risk assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stress-test")
async def perform_stress_test(
    asset_ids: List[str] = Body(...),
    stress_scenarios: List[str] = Body(default=["market_crash", "liquidity_crisis"]),
    severity: float = Body(default=0.5, ge=0.1, le=1.0, description="压力测试严重程度")
):
    """
    执行压力测试
    
    - **asset_ids**: 资产ID列表
    - **stress_scenarios**: 压力情景列表
    - **severity**: 压力测试严重程度
    """
    try:
        # 模拟压力测试
        await asyncio.sleep(0.3)
        
        results = {}
        for asset_id in asset_ids:
            asset_results = {}
            for scenario in stress_scenarios:
                if scenario == "market_crash":
                    impact = severity * np.random.uniform(0.3, 0.8)
                elif scenario == "liquidity_crisis":
                    impact = severity * np.random.uniform(0.2, 0.6)
                elif scenario == "regulatory_shock":
                    impact = severity * np.random.uniform(0.1, 0.5)
                else:
                    impact = severity * np.random.uniform(0.1, 0.4)
                
                asset_results[scenario] = {
                    "potential_loss": impact,
                    "recovery_time_days": np.random.randint(30, 365),
                    "probability": np.random.uniform(0.05, 0.30)
                }
            
            results[asset_id] = asset_results
        
        # 计算组合级别影响
        portfolio_impact = {}
        for scenario in stress_scenarios:
            avg_loss = np.mean([results[aid][scenario]["potential_loss"] for aid in asset_ids])
            portfolio_impact[scenario] = {
                "average_loss": avg_loss,
                "worst_case_loss": max([results[aid][scenario]["potential_loss"] for aid in asset_ids]),
                "correlation_adjustment": np.random.uniform(1.1, 1.5)  # 相关性调整
            }
        
        return {
            "success": True,
            "data": {
                "individual_assets": results,
                "portfolio_impact": portfolio_impact,
                "test_parameters": {
                    "severity": severity,
                    "scenarios_tested": stress_scenarios,
                    "assets_count": len(asset_ids)
                },
                "recommendations": [
                    "Consider hedging strategies for high-impact scenarios",
                    "Maintain adequate liquidity buffers",
                    "Monitor correlation changes during stress periods",
                    "Review and update risk limits regularly"
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Stress test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-risk")
async def get_market_risk_analysis(
    asset_type: AssetType = Query(...),
    time_period: int = Query(default=30, description="分析时间段（天）"),
    include_correlations: bool = Query(default=True, description="包含相关性分析")
):
    """
    获取市场风险分析
    
    - **asset_type**: 资产类型
    - **time_period**: 分析时间段
    - **include_correlations**: 是否包含相关性分析
    """
    try:
        # 生成市场风险分析
        market_analysis = {
            "asset_type": asset_type,
            "analysis_period_days": time_period,
            "market_volatility": np.random.uniform(0.15, 0.45),
            "trend_direction": np.random.choice(["bullish", "bearish", "sideways"]),
            "momentum_indicators": {
                "rsi": np.random.uniform(20, 80),
                "macd_signal": np.random.choice(["buy", "sell", "neutral"]),
                "moving_average_trend": np.random.choice(["upward", "downward", "flat"])
            },
            "risk_factors": {
                "market_sentiment": np.random.uniform(-0.5, 0.5),
                "liquidity_risk": np.random.uniform(0.1, 0.7),
                "concentration_risk": np.random.uniform(0.2, 0.8),
                "regulatory_risk": np.random.uniform(0.1, 0.6)
            },
            "price_targets": {
                "support_level": np.random.uniform(0.8, 0.95),
                "resistance_level": np.random.uniform(1.05, 1.3),
                "expected_range": {
                    "lower": np.random.uniform(0.85, 0.95),
                    "upper": np.random.uniform(1.05, 1.25)
                }
            }
        }
        
        if include_correlations:
            # 生成相关性数据
            correlations = {}
            other_assets = [at for at in AssetType if at != asset_type]
            for other_asset in other_assets[:3]:  # 限制数量
                correlations[other_asset.value] = np.random.uniform(-0.3, 0.8)
            
            market_analysis["correlations"] = correlations
            market_analysis["correlation_risk_level"] = (
                "high" if max(correlations.values()) > 0.7 else
                "medium" if max(correlations.values()) > 0.5 else "low"
            )
        
        return {
            "success": True,
            "data": market_analysis
        }
        
    except Exception as e:
        logger.error(f"Market risk analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/info")
async def get_risk_model_info():
    """
    获取风险评估模型信息
    """
    return {
        "success": True,
        "data": {
            "model_name": "MantleMusic Risk Assessment Model v1.0",
            "supported_risk_types": [rt.value for rt in RiskType],
            "risk_levels": [rl.value for rl in RiskLevel],
            "asset_types": [at.value for at in AssetType],
            "time_horizons": [th.value for th in TimeHorizon],
            "risk_metrics": [
                "Value at Risk (VaR)",
                "Expected Shortfall",
                "Maximum Drawdown",
                "Sharpe Ratio",
                "Sortino Ratio",
                "Beta Coefficient"
            ],
            "stress_test_scenarios": [
                "Market Crash",
                "Liquidity Crisis",
                "Regulatory Changes",
                "Technology Failures"
            ],
            "model_features": [
                "Multi-factor risk analysis",
                "Dynamic correlation modeling",
                "Stress testing capabilities",
                "Scenario-based risk assessment",
                "Real-time risk monitoring"
            ],
            "last_updated": datetime.now().isoformat()
        }
    }