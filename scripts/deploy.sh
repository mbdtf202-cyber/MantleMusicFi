#!/bin/bash

# MantleMusic 部署脚本
set -e

echo "🚀 开始部署 MantleMusic..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production文件不存在，使用默认配置"
    cp .env.example .env.production
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 清理旧镜像（可选）
read -p "是否清理旧镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker system prune -f
fi

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose build --no-cache

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 健康检查
echo "🏥 执行健康检查..."

# 检查后端API
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 后端API服务正常"
else
    echo "❌ 后端API服务异常"
fi

# 检查AI服务
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ AI服务正常"
else
    echo "❌ AI服务异常"
fi

# 检查前端服务
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
fi

echo "🎉 部署完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端API: http://localhost:3001"
echo "🤖 AI服务: http://localhost:8000"
echo "📊 API文档: http://localhost:8000/docs"

echo "📝 查看日志命令:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f ai-service"
echo "  docker-compose logs -f frontend"