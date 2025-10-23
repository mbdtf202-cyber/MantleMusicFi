"""
AI服务配置文件
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    """应用配置"""
    
    # 应用基础配置
    app_name: str = Field("MantleMusic AI Service", description="应用名称")
    app_version: str = Field("1.0.0", description="应用版本")
    debug: bool = Field(False, description="调试模式")
    
    # 服务器配置
    host: str = Field("0.0.0.0", description="服务器地址")
    port: int = Field(8000, description="服务器端口")
    workers: int = Field(1, description="工作进程数")
    
    # API配置
    api_prefix: str = Field("/api/v1", description="API前缀")
    docs_url: str = Field("/docs", description="文档URL")
    redoc_url: str = Field("/redoc", description="ReDoc URL")
    
    # CORS配置
    cors_origins: List[str] = Field(
        ["http://localhost:3000", "http://localhost:3001"],
        description="允许的CORS源"
    )
    cors_methods: List[str] = Field(
        ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        description="允许的HTTP方法"
    )
    cors_headers: List[str] = Field(
        ["*"],
        description="允许的请求头"
    )
    
    # 数据库配置
    mongodb_url: str = Field(
        "mongodb://localhost:27017/mantlemusic",
        description="MongoDB连接URL"
    )
    redis_url: str = Field(
        "redis://localhost:6379/0",
        description="Redis连接URL"
    )
    
    # 模型配置
    models_dir: str = Field("./models", description="模型文件目录")
    model_cache_size: int = Field(5, description="模型缓存大小")
    model_load_timeout: int = Field(300, description="模型加载超时时间(秒)")
    
    # 文件处理配置
    max_file_size: int = Field(50 * 1024 * 1024, description="最大文件大小(字节)")
    temp_dir: str = Field("/tmp", description="临时文件目录")
    upload_dir: str = Field("./uploads", description="上传文件目录")
    
    # 音频处理配置
    supported_audio_formats: List[str] = Field(
        ["mp3", "wav", "flac", "m4a", "aac", "ogg"],
        description="支持的音频格式"
    )
    max_audio_duration: int = Field(600, description="最大音频时长(秒)")
    default_sample_rate: int = Field(44100, description="默认采样率")
    
    # 推荐系统配置
    recommendation_cache_ttl: int = Field(3600, description="推荐缓存TTL(秒)")
    max_recommendations: int = Field(50, description="最大推荐数量")
    similarity_threshold: float = Field(0.5, description="相似度阈值")
    
    # 外部API配置
    openai_api_key: Optional[str] = Field(None, description="OpenAI API密钥")
    huggingface_token: Optional[str] = Field(None, description="HuggingFace Token")
    
    # 日志配置
    log_level: str = Field("INFO", description="日志级别")
    log_file: Optional[str] = Field(None, description="日志文件路径")
    log_format: str = Field(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="日志格式"
    )
    
    # 监控配置
    enable_metrics: bool = Field(True, description="启用指标收集")
    metrics_port: int = Field(9090, description="指标端口")
    health_check_interval: int = Field(30, description="健康检查间隔(秒)")
    
    # 安全配置
    secret_key: str = Field("your-secret-key-here", description="密钥")
    access_token_expire_minutes: int = Field(30, description="访问令牌过期时间(分钟)")
    
    # 性能配置
    max_concurrent_requests: int = Field(100, description="最大并发请求数")
    request_timeout: int = Field(300, description="请求超时时间(秒)")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# 创建全局设置实例
settings = Settings()

# 模型配置
MODEL_CONFIGS = {
    "genre_classifier": {
        "type": "sklearn",
        "path": "models/genre_classifier.joblib",
        "required": False,
        "description": "音乐流派分类器"
    },
    "audio_similarity": {
        "type": "custom",
        "path": "models/audio_similarity.pkl",
        "required": False,
        "description": "音频相似度模型"
    },
    "sentiment_analyzer": {
        "type": "transformers",
        "model_name": "cardiffnlp/twitter-roberta-base-sentiment-latest",
        "required": False,
        "description": "情感分析模型"
    },
    "text_similarity": {
        "type": "transformers",
        "model_name": "sentence-transformers/all-MiniLM-L6-v2",
        "required": False,
        "description": "文本相似度模型"
    },
    "collaborative_filtering": {
        "type": "custom",
        "path": "models/collaborative_filtering.pkl",
        "required": False,
        "description": "协同过滤推荐模型"
    },
    "content_based": {
        "type": "custom",
        "path": "models/content_based.pkl",
        "required": False,
        "description": "基于内容的推荐模型"
    },
    "hybrid_recommender": {
        "type": "custom",
        "path": "models/hybrid_recommender.pkl",
        "required": False,
        "description": "混合推荐模型"
    }
}

# 音频特征配置
AUDIO_FEATURES_CONFIG = {
    "mfcc": {
        "n_mfcc": 13,
        "n_fft": 2048,
        "hop_length": 512
    },
    "spectral": {
        "n_fft": 2048,
        "hop_length": 512
    },
    "tempo": {
        "hop_length": 512
    },
    "chroma": {
        "n_fft": 2048,
        "hop_length": 512
    }
}

# 推荐系统配置
RECOMMENDATION_CONFIG = {
    "collaborative_filtering": {
        "n_factors": 50,
        "n_epochs": 20,
        "lr_all": 0.005,
        "reg_all": 0.02
    },
    "content_based": {
        "similarity_metric": "cosine",
        "n_neighbors": 10
    },
    "hybrid": {
        "collaborative_weight": 0.6,
        "content_weight": 0.4
    }
}

# API限制配置
API_LIMITS = {
    "audio_analysis": {
        "max_file_size": 50 * 1024 * 1024,  # 50MB
        "max_duration": 600,  # 10分钟
        "rate_limit": "10/minute"
    },
    "recommendations": {
        "max_items": 50,
        "rate_limit": "100/minute"
    },
    "audio_processing": {
        "max_file_size": 100 * 1024 * 1024,  # 100MB
        "max_duration": 1800,  # 30分钟
        "rate_limit": "5/minute"
    }
}