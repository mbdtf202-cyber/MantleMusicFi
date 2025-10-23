"""
模型管理器
负责加载、管理和优化AI模型
"""

import os
import logging
import asyncio
import psutil
from typing import Dict, List, Optional, Any
from pathlib import Path
import torch
import numpy as np
from transformers import AutoModel, AutoTokenizer, pipeline
import librosa
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

class ModelManager:
    """AI模型管理器"""
    
    def __init__(self):
        self.initialized = False
        self.models = {}
        self.tokenizers = {}
        self.pipelines = {}
        self.feature_extractors = {}
        self.device = self._get_device()
        self.model_cache_dir = Path(os.getenv("MODEL_CACHE_DIR", "./models"))
        self.model_cache_dir.mkdir(exist_ok=True)
        
    def _get_device(self) -> str:
        """获取计算设备"""
        if torch.cuda.is_available():
            return "cuda"
        elif torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"
    
    async def initialize(self):
        """初始化模型管理器"""
        try:
            logger.info(f"🔧 初始化模型管理器，使用设备: {self.device}")
            
            # 创建模型目录
            self.model_cache_dir.mkdir(exist_ok=True)
            
            # 初始化基础组件
            await self._initialize_audio_models()
            await self._initialize_text_models()
            await self._initialize_recommendation_models()
            
            self.initialized = True
            logger.info("✅ 模型管理器初始化完成")
            
        except Exception as e:
            logger.error(f"❌ 模型管理器初始化失败: {e}")
            raise
    
    async def _initialize_audio_models(self):
        """初始化音频分析模型"""
        try:
            # 音频特征提取器
            self.feature_extractors['audio'] = {
                'sample_rate': 22050,
                'n_mels': 128,
                'n_fft': 2048,
                'hop_length': 512
            }
            
            # 音乐流派分类模型（简化版本）
            self.models['genre_classifier'] = self._create_simple_genre_classifier()
            
            # 音频相似度计算器
            self.models['audio_similarity'] = self._create_audio_similarity_model()
            
            logger.info("✅ 音频模型初始化完成")
            
        except Exception as e:
            logger.error(f"❌ 音频模型初始化失败: {e}")
            raise
    
    async def _initialize_text_models(self):
        """初始化文本分析模型"""
        try:
            # 情感分析管道（使用轻量级模型）
            try:
                self.pipelines['sentiment'] = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    device=0 if self.device == "cuda" else -1
                )
            except Exception:
                # 备用方案：使用简单的情感分析
                self.pipelines['sentiment'] = self._create_simple_sentiment_analyzer()
            
            # 文本相似度计算器
            self.models['text_similarity'] = TfidfVectorizer(
                max_features=5000,
                stop_words='english',
                ngram_range=(1, 2)
            )
            
            logger.info("✅ 文本模型初始化完成")
            
        except Exception as e:
            logger.error(f"❌ 文本模型初始化失败: {e}")
            raise
    
    async def _initialize_recommendation_models(self):
        """初始化推荐模型"""
        try:
            # 协同过滤模型（简化版本）
            self.models['collaborative_filter'] = self._create_collaborative_filter()
            
            # 内容推荐模型
            self.models['content_recommender'] = self._create_content_recommender()
            
            # 混合推荐模型
            self.models['hybrid_recommender'] = self._create_hybrid_recommender()
            
            logger.info("✅ 推荐模型初始化完成")
            
        except Exception as e:
            logger.error(f"❌ 推荐模型初始化失败: {e}")
            raise
    
    def _create_simple_genre_classifier(self):
        """创建简单的音乐流派分类器"""
        class SimpleGenreClassifier:
            def __init__(self):
                self.genres = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop']
            
            def predict(self, audio_features):
                """基于音频特征预测流派"""
                # 简化的流派分类逻辑
                if audio_features.get('tempo', 120) > 140:
                    return 'electronic' if audio_features.get('energy', 0.5) > 0.7 else 'pop'
                elif audio_features.get('tempo', 120) < 80:
                    return 'classical' if audio_features.get('acousticness', 0.5) > 0.7 else 'jazz'
                else:
                    return 'rock' if audio_features.get('energy', 0.5) > 0.6 else 'pop'
        
        return SimpleGenreClassifier()
    
    def _create_audio_similarity_model(self):
        """创建音频相似度模型"""
        class AudioSimilarityModel:
            def compute_similarity(self, features1, features2):
                """计算两个音频特征的相似度"""
                # 使用余弦相似度
                f1 = np.array(list(features1.values()))
                f2 = np.array(list(features2.values()))
                
                # 归一化
                f1_norm = f1 / np.linalg.norm(f1)
                f2_norm = f2 / np.linalg.norm(f2)
                
                # 计算余弦相似度
                similarity = np.dot(f1_norm, f2_norm)
                return float(similarity)
        
        return AudioSimilarityModel()
    
    def _create_simple_sentiment_analyzer(self):
        """创建简单的情感分析器"""
        class SimpleSentimentAnalyzer:
            def __init__(self):
                # 简单的情感词典
                self.positive_words = {'love', 'happy', 'joy', 'amazing', 'wonderful', 'great', 'beautiful'}
                self.negative_words = {'hate', 'sad', 'angry', 'terrible', 'awful', 'bad', 'horrible'}
            
            def __call__(self, text):
                words = text.lower().split()
                positive_count = sum(1 for word in words if word in self.positive_words)
                negative_count = sum(1 for word in words if word in self.negative_words)
                
                if positive_count > negative_count:
                    return [{'label': 'POSITIVE', 'score': 0.7}]
                elif negative_count > positive_count:
                    return [{'label': 'NEGATIVE', 'score': 0.7}]
                else:
                    return [{'label': 'NEUTRAL', 'score': 0.5}]
        
        return SimpleSentimentAnalyzer()
    
    def _create_collaborative_filter(self):
        """创建协同过滤模型"""
        class CollaborativeFilter:
            def __init__(self):
                self.user_item_matrix = None
                self.similarity_matrix = None
            
            def fit(self, user_item_data):
                """训练协同过滤模型"""
                # 简化的协同过滤实现
                self.user_item_matrix = user_item_data
                # 计算用户相似度矩阵
                self.similarity_matrix = cosine_similarity(user_item_data)
            
            def recommend(self, user_id, n_recommendations=10):
                """为用户推荐音乐"""
                if self.user_item_matrix is None:
                    return []
                
                # 简化的推荐逻辑
                similar_users = self.similarity_matrix[user_id].argsort()[-10:][::-1]
                recommendations = []
                
                for similar_user in similar_users:
                    if similar_user != user_id:
                        # 获取相似用户喜欢的音乐
                        user_items = self.user_item_matrix[similar_user]
                        recommendations.extend(user_items.nonzero()[0])
                
                return list(set(recommendations))[:n_recommendations]
        
        return CollaborativeFilter()
    
    def _create_content_recommender(self):
        """创建内容推荐模型"""
        class ContentRecommender:
            def __init__(self):
                self.feature_matrix = None
                self.similarity_matrix = None
            
            def fit(self, music_features):
                """训练内容推荐模型"""
                self.feature_matrix = music_features
                self.similarity_matrix = cosine_similarity(music_features)
            
            def recommend(self, music_id, n_recommendations=10):
                """基于音乐内容推荐相似音乐"""
                if self.similarity_matrix is None:
                    return []
                
                similarities = self.similarity_matrix[music_id]
                similar_indices = similarities.argsort()[-n_recommendations-1:-1][::-1]
                
                return similar_indices.tolist()
        
        return ContentRecommender()
    
    def _create_hybrid_recommender(self):
        """创建混合推荐模型"""
        class HybridRecommender:
            def __init__(self, collaborative_filter, content_recommender):
                self.collaborative_filter = collaborative_filter
                self.content_recommender = content_recommender
                self.cf_weight = 0.6
                self.content_weight = 0.4
            
            def recommend(self, user_id, music_id=None, n_recommendations=10):
                """混合推荐"""
                recommendations = []
                
                # 协同过滤推荐
                cf_recs = self.collaborative_filter.recommend(user_id, n_recommendations)
                recommendations.extend([(rec, self.cf_weight) for rec in cf_recs])
                
                # 内容推荐
                if music_id is not None:
                    content_recs = self.content_recommender.recommend(music_id, n_recommendations)
                    recommendations.extend([(rec, self.content_weight) for rec in content_recs])
                
                # 合并和排序
                rec_scores = {}
                for rec, weight in recommendations:
                    rec_scores[rec] = rec_scores.get(rec, 0) + weight
                
                sorted_recs = sorted(rec_scores.items(), key=lambda x: x[1], reverse=True)
                return [rec for rec, score in sorted_recs[:n_recommendations]]
        
        return HybridRecommender(
            self.models.get('collaborative_filter'),
            self.models.get('content_recommender')
        )
    
    async def preload_models(self):
        """预加载核心模型"""
        try:
            logger.info("🔄 预加载核心模型...")
            
            # 这里可以添加模型预热逻辑
            # 例如：运行一些示例推理来初始化模型
            
            logger.info("✅ 核心模型预加载完成")
            
        except Exception as e:
            logger.error(f"❌ 模型预加载失败: {e}")
            raise
    
    def get_model(self, model_name: str):
        """获取模型"""
        return self.models.get(model_name)
    
    def get_pipeline(self, pipeline_name: str):
        """获取管道"""
        return self.pipelines.get(pipeline_name)
    
    def get_feature_extractor(self, extractor_name: str):
        """获取特征提取器"""
        return self.feature_extractors.get(extractor_name)
    
    def get_loaded_models(self) -> List[str]:
        """获取已加载的模型列表"""
        return list(self.models.keys()) + list(self.pipelines.keys())
    
    def get_model_info(self) -> Dict[str, Any]:
        """获取模型信息"""
        return {
            "device": self.device,
            "models_count": len(self.models),
            "pipelines_count": len(self.pipelines),
            "feature_extractors_count": len(self.feature_extractors),
            "cache_dir": str(self.model_cache_dir)
        }
    
    def get_memory_usage(self) -> Dict[str, Any]:
        """获取内存使用情况"""
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            "rss": memory_info.rss / 1024 / 1024,  # MB
            "vms": memory_info.vms / 1024 / 1024,  # MB
            "percent": process.memory_percent(),
            "available": psutil.virtual_memory().available / 1024 / 1024  # MB
        }
    
    async def cleanup(self):
        """清理资源"""
        try:
            logger.info("🔄 清理模型资源...")
            
            # 清理模型
            self.models.clear()
            self.pipelines.clear()
            self.feature_extractors.clear()
            
            # 清理GPU缓存
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info("✅ 资源清理完成")
            
        except Exception as e:
            logger.error(f"❌ 资源清理失败: {e}")
    
    def extract_audio_features(self, audio_path: str) -> Dict[str, float]:
        """提取音频特征"""
        try:
            # 加载音频
            y, sr = librosa.load(audio_path, sr=self.feature_extractors['audio']['sample_rate'])
            
            # 提取特征
            features = {}
            
            # 基础特征
            features['tempo'] = float(librosa.beat.tempo(y=y, sr=sr)[0])
            features['duration'] = float(len(y) / sr)
            
            # 频谱特征
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            features['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
            features['spectral_centroid_std'] = float(np.std(spectral_centroids))
            
            # MFCC特征
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            for i in range(13):
                features[f'mfcc_{i}_mean'] = float(np.mean(mfccs[i]))
                features[f'mfcc_{i}_std'] = float(np.std(mfccs[i]))
            
            # 色度特征
            chroma = librosa.feature.chroma(y=y, sr=sr)
            features['chroma_mean'] = float(np.mean(chroma))
            features['chroma_std'] = float(np.std(chroma))
            
            # 零交叉率
            zcr = librosa.feature.zero_crossing_rate(y)
            features['zcr_mean'] = float(np.mean(zcr))
            features['zcr_std'] = float(np.std(zcr))
            
            # 简化的高级特征
            features['energy'] = float(np.mean(y**2))
            features['acousticness'] = float(1.0 / (1.0 + features['spectral_centroid_mean'] / 1000))
            features['danceability'] = float(min(1.0, features['tempo'] / 180))
            features['valence'] = float(0.5 + 0.5 * np.tanh((features['tempo'] - 120) / 60))
            
            return features
            
        except Exception as e:
            logger.error(f"音频特征提取失败: {e}")
            return {}
    
    def analyze_lyrics_sentiment(self, lyrics: str) -> Dict[str, Any]:
        """分析歌词情感"""
        try:
            sentiment_pipeline = self.get_pipeline('sentiment')
            if sentiment_pipeline:
                result = sentiment_pipeline(lyrics)
                return {
                    'sentiment': result[0]['label'].lower(),
                    'confidence': result[0]['score']
                }
            else:
                return {'sentiment': 'neutral', 'confidence': 0.5}
                
        except Exception as e:
            logger.error(f"歌词情感分析失败: {e}")
            return {'sentiment': 'neutral', 'confidence': 0.5}