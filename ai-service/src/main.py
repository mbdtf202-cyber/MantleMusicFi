"""MantleMusic AI服务主应用
基于FastAPI的音乐分析、推荐和处理服务
"""

import logging
import asyncio
import sys
import os
from contextlib import asynccontextmanager
from typing import Dict, Any

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# 导入API路由
from src.api import revenue_prediction, credit_scoring, risk_assessment, recommendations, music_analysis

# 简化的配置
class SimpleSettings:
    app_name = "MantleMusic AI Service"
    app_version = "1.0.0"
    debug = True
    host = "0.0.0.0"
    port = 8000
    api_prefix = "/api/v1"
    cors_origins = ["http://localhost:3000", "http://localhost:3001"]
    log_level = "INFO"

settings = SimpleSettings()

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# 全局模型管理器
model_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化
    logger.info("🚀 正在启动AI服务...")
    
    try:
        # 初始化AI模型
        logger.info("📊 Loading AI models...")
        
        # 初始化模型管理器
        global model_manager
        from src.services.model_manager import ModelManager
        model_manager = ModelManager()
        await model_manager.initialize()
        
        # 将模型管理器存储到应用状态中
        app.state.model_manager = model_manager
        
        logger.info("  - Revenue Prediction Model loaded")
        logger.info("  - Credit Scoring Model loaded")
        logger.info("  - Risk Assessment Model loaded")
        logger.info("✅ AI服务初始化完成")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ 服务启动失败: {e}")
        raise
    finally:
        # 关闭时清理
        logger.info("🛑 正在关闭AI服务...")
        if model_manager:
            await model_manager.cleanup()
        logger.info("✅ AI服务已关闭")

# 创建FastAPI应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="MantleMusic平台的AI服务，提供音乐分析、推荐和处理功能，包括收入预测、信用评分和风险评估",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 注册API路由
app.include_router(revenue_prediction.router, prefix="/api/v1", tags=["revenue"])
app.include_router(credit_scoring.router, prefix="/api/v1", tags=["credit"])
app.include_router(risk_assessment.router, prefix="/api/v1", tags=["risk"])
app.include_router(recommendations.router, prefix="/api/v1", tags=["recommendations"])
app.include_router(music_analysis.router, prefix="/api/v1", tags=["music-analysis"])

# 中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    logger.error(f"未处理的异常: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "服务器内部错误",
            "error": str(exc) if settings.debug else "Internal server error"
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查端点"""
    try:
        import time
        return {
            "status": "healthy",
            "service": "MantleMusic AI Service",
            "version": settings.app_version,
            "timestamp": time.time(),
            "uptime": "running",
            "services": {
                "revenue_prediction": "operational",
                "credit_scoring": "operational", 
                "risk_assessment": "operational"
            }
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "MantleMusic AI Service",
                "error": str(e)
            }
        )

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "MantleMusic AI Service",
        "version": settings.app_version,
        "description": "AI-powered music industry financial services",
        "services": [
            "Revenue Prediction",
            "Credit Scoring", 
            "Risk Assessment"
        ],
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "revenue_prediction": "/api/v1/revenue",
            "credit_scoring": "/api/v1/credit",
            "risk_assessment": "/api/v1/risk"
        }
    }

# API路由
@app.get(f"{settings.api_prefix}/status")
async def api_status():
    """API状态"""
    return {
        "api_status": "operational",
        "services": {
            "revenue_prediction": {
                "status": "available",
                "endpoints": ["/predict", "/analyze", "/trends", "/batch-predict"],
                "description": "Music revenue prediction and market analysis"
            },
            "credit_scoring": {
                "status": "available", 
                "endpoints": ["/score", "/analyze", "/benchmark", "/batch-score"],
                "description": "Artist and investor credit scoring"
            },
            "risk_assessment": {
                "status": "available",
                "endpoints": ["/assess", "/portfolio", "/stress-test", "/market-risk"],
                "description": "Investment risk assessment and analysis"
            }
        },
        "uptime": "running",
        "debug": settings.debug
    }

# 服务信息
@app.get(f"{settings.api_prefix}/info")
async def service_info():
    """获取服务详细信息"""
    return {
        "service_name": "MantleMusic AI Service",
        "version": settings.app_version,
        "description": "Comprehensive AI service for music industry financial analysis",
        "capabilities": {
            "revenue_prediction": {
                "description": "Predict music revenue using ML models",
                "features": [
                    "Individual track revenue prediction",
                    "Market trend analysis",
                    "Genre performance analysis",
                    "Batch prediction processing"
                ]
            },
            "credit_scoring": {
                "description": "Assess creditworthiness of artists and investors",
                "features": [
                    "Multi-factor credit scoring",
                    "Risk level assessment",
                    "Credit history analysis",
                    "Benchmark comparisons"
                ]
            },
            "risk_assessment": {
                "description": "Comprehensive investment risk analysis",
                "features": [
                    "Multi-dimensional risk assessment",
                    "Portfolio risk analysis",
                    "Stress testing",
                    "Market risk monitoring"
                ]
            }
        },
        "supported_formats": {
            "input": ["JSON", "Form Data"],
            "output": ["JSON"]
        },
        "rate_limits": {
            "default": "1000 requests/hour",
            "batch_operations": "100 requests/hour"
        }
    }

# 开发模式下的额外路由
if os.getenv("DEBUG") == "true":
    @app.get("/debug/info")
    async def debug_info():
        """调试信息"""
        return {
            "environment": dict(os.environ),
            "model_manager": {
                "initialized": model_manager.initialized,
                "models": model_manager.get_loaded_models()
            }
        }

if __name__ == "__main__":
    # 配置
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    # 启动服务器
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug",
        access_log=True
    )