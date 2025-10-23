#!/bin/bash

# MantleMusic 测试运行脚本
set -e

echo "🧪 开始运行 MantleMusic 测试套件..."

# 检查服务是否运行
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo "检查 $service_name 服务状态..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "$url" > /dev/null 2>&1; then
            echo "✅ $service_name 服务正常"
            return 0
        fi
        
        echo "⏳ 等待 $service_name 服务启动... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name 服务启动失败或超时"
    return 1
}

# 安装测试依赖
echo "📦 安装测试依赖..."
cd tests
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# 检查所有服务
echo "🔍 检查服务状态..."
check_service "后端API" "http://localhost:3001/health"
check_service "AI服务" "http://localhost:8000/health"

# 设置测试环境变量
export NODE_ENV=test
export API_BASE_URL=http://localhost:3001
export AI_BASE_URL=http://localhost:8000
export FRONTEND_URL=http://localhost:3000

# 运行测试
echo "🚀 开始运行测试..."

# 解析命令行参数
TEST_TYPE=${1:-all}

case $TEST_TYPE in
    "unit")
        echo "运行单元测试..."
        cd tests && npm run test:unit
        ;;
    "integration")
        echo "运行集成测试..."
        cd tests && npm run test:integration
        ;;
    "e2e")
        echo "运行端到端测试..."
        cd tests && npm run test:e2e
        ;;
    "all")
        echo "运行所有测试..."
        cd tests && npm run test:all
        ;;
    "coverage")
        echo "运行测试覆盖率分析..."
        cd tests && npm run test:coverage
        ;;
    *)
        echo "❌ 无效的测试类型: $TEST_TYPE"
        echo "可用选项: unit, integration, e2e, all, coverage"
        exit 1
        ;;
esac

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 所有测试通过！"
else
    echo "❌ 测试失败，退出码: $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE