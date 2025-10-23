"""
文件处理工具函数
"""

import os
import tempfile
import aiofiles
from typing import Optional
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)

# 支持的音频格式
SUPPORTED_AUDIO_FORMATS = {
    'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma'
}

# 最大文件大小 (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

def validate_audio_file(file: UploadFile) -> bool:
    """
    验证音频文件
    
    Args:
        file: 上传的文件
        
    Returns:
        bool: 是否为有效的音频文件
    """
    try:
        # 检查文件名
        if not file.filename:
            return False
        
        # 检查文件扩展名
        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in SUPPORTED_AUDIO_FORMATS:
            return False
        
        # 检查文件大小
        if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
            return False
        
        # 检查MIME类型
        if file.content_type and not file.content_type.startswith('audio/'):
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"文件验证失败: {e}")
        return False

async def save_upload_file(file: UploadFile) -> str:
    """
    保存上传的文件到临时目录
    
    Args:
        file: 上传的文件
        
    Returns:
        str: 临时文件路径
    """
    try:
        # 生成临时文件路径
        file_extension = file.filename.split('.')[-1] if file.filename else 'tmp'
        temp_file = tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=f'.{file_extension}'
        )
        temp_path = temp_file.name
        temp_file.close()
        
        # 异步保存文件
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # 重置文件指针
        await file.seek(0)
        
        return temp_path
        
    except Exception as e:
        logger.error(f"文件保存失败: {e}")
        raise

def get_file_info(file_path: str) -> dict:
    """
    获取文件信息
    
    Args:
        file_path: 文件路径
        
    Returns:
        dict: 文件信息
    """
    try:
        if not os.path.exists(file_path):
            return {}
        
        stat = os.stat(file_path)
        file_extension = os.path.splitext(file_path)[1].lower().lstrip('.')
        
        return {
            'size': stat.st_size,
            'format': file_extension,
            'path': file_path,
            'exists': True
        }
        
    except Exception as e:
        logger.error(f"获取文件信息失败: {e}")
        return {'exists': False}

def cleanup_temp_file(file_path: str) -> bool:
    """
    清理临时文件
    
    Args:
        file_path: 文件路径
        
    Returns:
        bool: 是否成功删除
    """
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            return True
        return False
        
    except Exception as e:
        logger.error(f"清理临时文件失败: {e}")
        return False

def validate_file_size(file_path: str, max_size: Optional[int] = None) -> bool:
    """
    验证文件大小
    
    Args:
        file_path: 文件路径
        max_size: 最大文件大小（字节），默认使用全局设置
        
    Returns:
        bool: 文件大小是否符合要求
    """
    try:
        if not os.path.exists(file_path):
            return False
        
        file_size = os.path.getsize(file_path)
        max_allowed = max_size or MAX_FILE_SIZE
        
        return file_size <= max_allowed
        
    except Exception as e:
        logger.error(f"文件大小验证失败: {e}")
        return False

def get_safe_filename(filename: str) -> str:
    """
    获取安全的文件名
    
    Args:
        filename: 原始文件名
        
    Returns:
        str: 安全的文件名
    """
    try:
        # 移除危险字符
        import re
        safe_filename = re.sub(r'[^\w\-_\.]', '_', filename)
        
        # 限制长度
        if len(safe_filename) > 255:
            name, ext = os.path.splitext(safe_filename)
            safe_filename = name[:255-len(ext)] + ext
        
        return safe_filename
        
    except Exception as e:
        logger.error(f"文件名处理失败: {e}")
        return "unknown_file"