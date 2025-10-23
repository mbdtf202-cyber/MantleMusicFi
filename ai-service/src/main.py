"""
MantleMusic AI服务主应用
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
    logger.info("正在启动AI服务...")
    
    try:
        # 简化的初始化
        global model_manager
        logger.info("AI服务初始化完成")
        
        yield
        
    except Exception as e:
        logger.error(f"服务启动失败: {e}")
        raise
    finally:
        # 关闭时清理
        logger.info("正在关闭AI服务...")
        logger.info("AI服务已关闭")

# 创建FastAPI应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="MantleMusic平台的AI服务，提供音乐分析、推荐和处理功能",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

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
            "uptime": "running"
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
        "docs": "/docs",
        "health": "/health"
    }

# 简化的API路由
@app.get(f"{settings.api_prefix}/status")
async def api_status():
    """API状态"""
    return {
        "success": True,
        "message": "AI服务运行正常",
        "endpoints": [
            f"{settings.api_prefix}/analysis",
            f"{settings.api_prefix}/recommendations", 
            f"{settings.api_prefix}/audio"
        ]
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