#!/bin/bash

# MantleMusic 开发环境启动脚本
set -e

echo "🚀 启动 MantleMusic 开发环境..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js版本过低，需要18+，当前版本: $(node -v)"
    exit 1
fi

# 检查Python版本
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python 3.9+"
    exit 1
fi

# 检查MongoDB是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB未运行，请先启动MongoDB"
    echo "   macOS: brew services start mongodb-community"
    echo "   Linux: sudo systemctl start mongod"
fi

# 安装依赖
echo "📦 安装依赖..."

# 前端依赖
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "安装后端依赖..."
    cd backend && npm install && cd ..
fi

# AI服务依赖
if [ ! -d "ai-service/venv" ]; then
    echo "创建Python虚拟环境..."
    cd ai-service
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# 检查环境变量文件
if [ ! -f "backend/.env" ]; then
    echo "创建后端环境变量文件..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "ai-service/.env" ]; then
    echo "创建AI服务环境变量文件..."
    cp ai-service/.env.example ai-service/.env
fi

if [ ! -f ".env.local" ]; then
    echo "创建前端环境变量文件..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_CHAIN_ID=5000
NEXT_PUBLIC_RPC_URL=https://rpc.mantle.xyz
EOF
fi

# 启动服务函数
start_backend() {
    echo "🔧 启动后端API服务..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    echo "后端服务PID: $BACKEND_PID"
}

start_ai_service() {
    echo "🤖 启动AI服务..."
    cd ai-service
    source venv/bin/activate
    python src/main.py &
    AI_PID=$!
    cd ..
    echo "AI服务PID: $AI_PID"
}

start_frontend() {
    echo "📱 启动前端服务..."
    npm run dev &
    FRONTEND_PID=$!
    echo "前端服务PID: $FRONTEND_PID"
}

# 清理函数
cleanup() {
    echo "🛑 停止所有服务..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$AI_PID" ]; then
        kill $AI_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 启动所有服务
start_backend
sleep 5
start_ai_service
sleep 5
start_frontend

echo "🎉 所有服务已启动！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端API: http://localhost:3001"
echo "🤖 AI服务: http://localhost:8000"
echo "📊 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait