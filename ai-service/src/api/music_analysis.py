"""
音乐分析API
提供音频特征提取、流派分类、情感分析等功能
"""

import logging
import tempfile
import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from pydantic import BaseModel, Field
import aiofiles

from services.model_manager import ModelManager
from utils.file_utils import validate_audio_file, save_upload_file

logger = logging.getLogger(__name__)

router = APIRouter()

# 请求/响应模型
class AudioAnalysisRequest(BaseModel):
    """音频分析请求"""
    extract_features: bool = Field(True, description="是否提取音频特征")
    classify_genre: bool = Field(True, description="是否进行流派分类")
    analyze_mood: bool = Field(True, description="是否分析音乐情绪")

class LyricsAnalysisRequest(BaseModel):
    """歌词分析请求"""
    lyrics: str = Field(..., description="歌词文本")
    analyze_sentiment: bool = Field(True, description="是否分析情感")
    extract_themes: bool = Field(True, description="是否提取主题")
    language: Optional[str] = Field(None, description="歌词语言")

class AudioFeaturesResponse(BaseModel):
    """音频特征响应"""
    success: bool
    data: Dict[str, Any]
    message: str = ""

class LyricsAnalysisResponse(BaseModel):
    """歌词分析响应"""
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

@router.post("/audio/features", response_model=AudioFeaturesResponse)
async def extract_audio_features(
    file: UploadFile = File(...),
    request: AudioAnalysisRequest = AudioAnalysisRequest(),
    model_manager: ModelManager = Depends(get_model_manager)
):
    """
    提取音频特征
    
    - **file**: 音频文件 (支持 mp3, wav, flac, m4a)
    - **extract_features**: 是否提取基础音频特征
    - **classify_genre**: 是否进行流派分类
    - **analyze_mood**: 是否分析音乐情绪
    """
    try:
        # 验证文件
        if not validate_audio_file(file):
            raise HTTPException(status_code=400, detail="不支持的音频文件格式")
        
        # 保存临时文件
        temp_path = await save_upload_file(file)
        
        try:
            result = {}
            
            # 提取音频特征
            if request.extract_features:
                logger.info(f"提取音频特征: {file.filename}")
                features = model_manager.extract_audio_features(temp_path)
                result['features'] = features
            
            # 流派分类
            if request.classify_genre and 'features' in result:
                logger.info(f"分类音乐流派: {file.filename}")
                genre_classifier = model_manager.get_model('genre_classifier')
                if genre_classifier:
                    predicted_genre = genre_classifier.predict(result['features'])
                    result['genre'] = {
                        'predicted': predicted_genre,
                        'confidence': 0.8  # 简化的置信度
                    }
            
            # 情绪分析
            if request.analyze_mood and 'features' in result:
                logger.info(f"分析音乐情绪: {file.filename}")
                mood = analyze_music_mood(result['features'])
                result['mood'] = mood
            
            return AudioFeaturesResponse(
                success=True,
                data=result,
                message="音频分析完成"
            )
            
        finally:
            # 清理临时文件
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"音频特征提取失败: {e}")
        raise HTTPException(status_code=500, detail=f"音频分析失败: {str(e)}")

@router.post("/lyrics/analyze", response_model=LyricsAnalysisResponse)
async def analyze_lyrics(
    request: LyricsAnalysisRequest,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """
    分析歌词
    
    - **lyrics**: 歌词文本
    - **analyze_sentiment**: 是否分析情感
    - **extract_themes**: 是否提取主题
    - **language**: 歌词语言（可选）
    """
    try:
        result = {}
        
        # 情感分析
        if request.analyze_sentiment:
            logger.info("分析歌词情感")
            sentiment = model_manager.analyze_lyrics_sentiment(request.lyrics)
            result['sentiment'] = sentiment
        
        # 主题提取
        if request.extract_themes:
            logger.info("提取歌词主题")
            themes = extract_lyrics_themes(request.lyrics)
            result['themes'] = themes
        
        # 语言检测
        if request.language is None:
            detected_language = detect_language(request.lyrics)
            result['language'] = detected_language
        else:
            result['language'] = request.language
        
        # 歌词统计
        stats = calculate_lyrics_stats(request.lyrics)
        result['statistics'] = stats
        
        return LyricsAnalysisResponse(
            success=True,
            data=result,
            message="歌词分析完成"
        )
        
    except Exception as e:
        logger.error(f"歌词分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"歌词分析失败: {str(e)}")

@router.post("/audio/similarity")
async def calculate_audio_similarity(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    model_manager: ModelManager = Depends(get_model_manager)
):
    """
    计算两个音频文件的相似度
    """
    try:
        # 验证文件
        if not validate_audio_file(file1) or not validate_audio_file(file2):
            raise HTTPException(status_code=400, detail="不支持的音频文件格式")
        
        # 保存临时文件
        temp_path1 = await save_upload_file(file1)
        temp_path2 = await save_upload_file(file2)
        
        try:
            # 提取特征
            features1 = model_manager.extract_audio_features(temp_path1)
            features2 = model_manager.extract_audio_features(temp_path2)
            
            # 计算相似度
            similarity_model = model_manager.get_model('audio_similarity')
            if similarity_model and features1 and features2:
                similarity = similarity_model.compute_similarity(features1, features2)
                
                return {
                    "success": True,
                    "data": {
                        "similarity": similarity,
                        "file1_features": features1,
                        "file2_features": features2
                    },
                    "message": "相似度计算完成"
                }
            else:
                raise HTTPException(status_code=500, detail="特征提取失败")
                
        finally:
            # 清理临时文件
            for path in [temp_path1, temp_path2]:
                if os.path.exists(path):
                    os.unlink(path)
                    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"相似度计算失败: {e}")
        raise HTTPException(status_code=500, detail=f"相似度计算失败: {str(e)}")

@router.get("/audio/supported-formats")
async def get_supported_formats():
    """获取支持的音频格式"""
    return {
        "success": True,
        "data": {
            "formats": ["mp3", "wav", "flac", "m4a", "aac", "ogg"],
            "max_file_size": "50MB",
            "max_duration": "10 minutes"
        }
    }

# 辅助函数
def analyze_music_mood(features: Dict[str, float]) -> Dict[str, Any]:
    """分析音乐情绪"""
    try:
        # 基于音频特征的简化情绪分析
        energy = features.get('energy', 0.5)
        valence = features.get('valence', 0.5)
        tempo = features.get('tempo', 120)
        
        # 情绪映射
        if energy > 0.7 and valence > 0.6:
            mood = "happy"
            intensity = "high"
        elif energy > 0.7 and valence < 0.4:
            mood = "aggressive"
            intensity = "high"
        elif energy < 0.3 and valence < 0.4:
            mood = "sad"
            intensity = "low"
        elif energy < 0.3 and valence > 0.6:
            mood = "peaceful"
            intensity = "low"
        else:
            mood = "neutral"
            intensity = "medium"
        
        # 活跃度
        if tempo > 140:
            activity = "high"
        elif tempo < 80:
            activity = "low"
        else:
            activity = "medium"
        
        return {
            "mood": mood,
            "intensity": intensity,
            "activity": activity,
            "energy": energy,
            "valence": valence,
            "confidence": 0.75
        }
        
    except Exception as e:
        logger.error(f"情绪分析失败: {e}")
        return {
            "mood": "neutral",
            "intensity": "medium",
            "activity": "medium",
            "confidence": 0.5
        }

def extract_lyrics_themes(lyrics: str) -> Dict[str, Any]:
    """提取歌词主题"""
    try:
        # 简化的主题提取
        themes = []
        keywords = lyrics.lower().split()
        
        # 主题关键词映射
        theme_keywords = {
            "love": ["love", "heart", "kiss", "romance", "together", "forever"],
            "sadness": ["sad", "cry", "tears", "lonely", "broken", "hurt"],
            "happiness": ["happy", "joy", "smile", "laugh", "celebrate", "party"],
            "freedom": ["free", "freedom", "fly", "escape", "break", "chains"],
            "friendship": ["friend", "together", "support", "help", "trust"],
            "family": ["family", "mother", "father", "home", "children"],
            "nature": ["sky", "sun", "moon", "stars", "ocean", "mountain"],
            "time": ["time", "yesterday", "tomorrow", "forever", "moment"],
            "dreams": ["dream", "hope", "wish", "future", "believe"]
        }
        
        # 计算主题得分
        theme_scores = {}
        for theme, theme_words in theme_keywords.items():
            score = sum(1 for word in keywords if word in theme_words)
            if score > 0:
                theme_scores[theme] = score / len(keywords)
        
        # 排序并选择前3个主题
        sorted_themes = sorted(theme_scores.items(), key=lambda x: x[1], reverse=True)
        themes = [{"theme": theme, "confidence": score} for theme, score in sorted_themes[:3]]
        
        return {
            "themes": themes,
            "dominant_theme": themes[0]["theme"] if themes else "general"
        }
        
    except Exception as e:
        logger.error(f"主题提取失败: {e}")
        return {"themes": [], "dominant_theme": "general"}

def detect_language(text: str) -> str:
    """检测文本语言"""
    try:
        # 简化的语言检测
        # 检测中文字符
        chinese_chars = sum(1 for char in text if '\u4e00' <= char <= '\u9fff')
        if chinese_chars > len(text) * 0.3:
            return "zh"
        
        # 检测日文字符
        japanese_chars = sum(1 for char in text if '\u3040' <= char <= '\u309f' or '\u30a0' <= char <= '\u30ff')
        if japanese_chars > len(text) * 0.1:
            return "ja"
        
        # 检测韩文字符
        korean_chars = sum(1 for char in text if '\uac00' <= char <= '\ud7af')
        if korean_chars > len(text) * 0.1:
            return "ko"
        
        # 默认英文
        return "en"
        
    except Exception:
        return "unknown"

def calculate_lyrics_stats(lyrics: str) -> Dict[str, Any]:
    """计算歌词统计信息"""
    try:
        words = lyrics.split()
        lines = lyrics.split('\n')
        
        return {
            "word_count": len(words),
            "line_count": len(lines),
            "character_count": len(lyrics),
            "average_words_per_line": len(words) / len(lines) if lines else 0,
            "unique_words": len(set(word.lower().strip('.,!?;:"()[]') for word in words)),
            "vocabulary_richness": len(set(word.lower() for word in words)) / len(words) if words else 0
        }
        
    except Exception as e:
        logger.error(f"歌词统计失败: {e}")
        return {}