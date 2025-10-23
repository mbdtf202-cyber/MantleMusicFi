#!/bin/bash

# ===========================================
# MantleMusicFi 云端部署脚本
# ===========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_dependencies() {
    log_info "检查部署依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    
    log_success "所有依赖检查通过"
}

# 环境变量检查
check_environment() {
    log_info "检查环境变量配置..."
    
    if [ ! -f ".env.production" ]; then
        log_error ".env.production 文件不存在，请先配置生产环境变量"
        exit 1
    fi
    
    # 检查关键环境变量
    source .env.production
    
    if [ "$MONGO_ROOT_PASSWORD" = "CHANGE_THIS_STRONG_PASSWORD_123!" ]; then
        log_warning "请修改 MongoDB 密码"
    fi
    
    if [ "$JWT_SECRET" = "CHANGE_THIS_SUPER_SECRET_JWT_KEY_789!" ]; then
        log_warning "请修改 JWT 密钥"
    fi
    
    if [ "$DOMAIN" = "your-domain.com" ]; then
        log_warning "请配置您的域名"
    fi
    
    log_success "环境变量检查完成"
}

# 构建Docker镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker build -f Dockerfile.frontend -t mantlemusic-frontend:latest .
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker build -f Dockerfile.backend -t mantlemusic-backend:latest .
    
    # 构建AI服务镜像
    log_info "构建AI服务镜像..."
    docker build -f Dockerfile.ai -t mantlemusic-ai:latest .
    
    log_success "所有镜像构建完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p ssl
    mkdir -p logs
    mkdir -p backups
    mkdir -p data/mongodb
    mkdir -p data/redis
    
    log_success "目录创建完成"
}

# 生成SSL证书（自签名，生产环境建议使用Let's Encrypt）
generate_ssl_cert() {
    log_info "生成SSL证书..."
    
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        log_info "生成自签名SSL证书（生产环境建议使用Let's Encrypt）..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN:-localhost}"
        
        log_success "SSL证书生成完成"
    else
        log_info "SSL证书已存在，跳过生成"
    fi
}

# 部署应用
deploy_application() {
    log_info "部署应用..."
    
    # 停止现有容器
    log_info "停止现有容器..."
    docker-compose -f docker-compose.prod.yml down || true
    
    # 清理未使用的镜像
    log_info "清理未使用的Docker镜像..."
    docker image prune -f || true
    
    # 启动服务
    log_info "启动生产环境服务..."
    docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    log_success "应用部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 30
    
    # 检查容器状态
    log_info "检查容器状态..."
    docker-compose -f docker-compose.prod.yml ps
    
    # 检查服务健康状态
    log_info "检查服务健康状态..."
    
    # 检查前端
    if curl -f http://localhost:80/health &> /dev/null; then
        log_success "前端服务健康"
    else
        log_warning "前端服务可能未就绪"
    fi
    
    # 检查后端
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_success "后端服务健康"
    else
        log_warning "后端服务可能未就绪"
    fi
    
    # 检查AI服务
    if curl -f http://localhost:8000/health &> /dev/null; then
        log_success "AI服务健康"
    else
        log_warning "AI服务可能未就绪"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "===========================================
    echo "  MantleMusicFi 部署信息"
    echo "==========================================="
    echo ""
    echo "🌐 应用访问地址:"
    echo "   主站: https://${DOMAIN:-localhost}"
    echo "   API:  https://${DOMAIN:-localhost}/api"
    echo "   AI:   https://${DOMAIN:-localhost}/ai"
    echo ""
    echo "📊 监控地址:"
    echo "   Grafana:    http://localhost:3001"
    echo "   Prometheus: http://localhost:9090"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看日志: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   重启服务: docker-compose -f docker-compose.prod.yml restart"
    echo "   停止服务: docker-compose -f docker-compose.prod.yml down"
    echo ""
    echo "⚠️  重要提醒:"
    echo "   1. 请确保已配置正确的域名DNS解析"
    echo "   2. 生产环境建议使用Let's Encrypt SSL证书"
    echo "   3. 定期备份数据库和重要文件"
    echo "   4. 监控系统资源使用情况"
    echo ""
}

# 主函数
main() {
    log_info "开始 MantleMusicFi 云端部署..."
    
    # 检查当前目录
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录执行此脚本"
        exit 1
    fi
    
    # 执行部署步骤
    check_dependencies
    check_environment
    create_directories
    generate_ssl_cert
    build_images
    deploy_application
    health_check
    show_deployment_info
    
    log_success "MantleMusicFi 云端部署完成！"
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi