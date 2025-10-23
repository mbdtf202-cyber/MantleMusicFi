# 🚀 MantleMusicFi 云端部署指南

本文档详细介绍如何将 MantleMusicFi 项目部署到云端，实现公网访问。

## 📋 目录

- [部署架构](#部署架构)
- [前置要求](#前置要求)
- [快速部署](#快速部署)
- [云平台部署](#云平台部署)
- [域名和SSL配置](#域名和ssl配置)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🏗️ 部署架构

```mermaid
graph TB
    subgraph "云服务器"
        subgraph "Nginx 负载均衡"
            LB[Nginx Load Balancer]
        end
        
        subgraph "应用层"
            FE1[Frontend Instance 1]
            FE2[Frontend Instance 2]
            BE1[Backend Instance 1]
            BE2[Backend Instance 2]
            BE3[Backend Instance 3]
            AI1[AI Service Instance 1]
            AI2[AI Service Instance 2]
        end
        
        subgraph "数据层"
            DB[(MongoDB)]
            CACHE[(Redis)]
        end
        
        subgraph "监控层"
            PROM[Prometheus]
            GRAF[Grafana]
            ELK[ELK Stack]
        end
    end
    
    subgraph "外部服务"
        CDN[CDN]
        DNS[DNS]
        SSL[SSL Certificate]
    end
    
    Internet --> CDN
    CDN --> DNS
    DNS --> LB
    LB --> FE1
    LB --> FE2
    LB --> BE1
    LB --> BE2
    LB --> BE3
    LB --> AI1
    LB --> AI2
    
    FE1 --> BE1
    FE2 --> BE2
    BE1 --> DB
    BE2 --> DB
    BE3 --> DB
    BE1 --> CACHE
    BE2 --> CACHE
    BE3 --> CACHE
    AI1 --> DB
    AI2 --> DB
```

## 🔧 前置要求

### 服务器要求
- **CPU**: 最少 4 核心，推荐 8 核心
- **内存**: 最少 8GB，推荐 16GB
- **存储**: 最少 100GB SSD，推荐 500GB
- **网络**: 稳定的公网IP和带宽
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### 软件要求
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- 域名（用于SSL证书）

### 云平台账号（可选）
- AWS / 阿里云 / 腾讯云等（用于对象存储和备份）
- Cloudflare（用于CDN和DNS）

## ⚡ 快速部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登录以应用Docker组权限
exit
```

### 2. 克隆项目

```bash
# 创建项目目录
sudo mkdir -p /opt/mantlemusic
sudo chown $USER:$USER /opt/mantlemusic
cd /opt/mantlemusic

# 克隆项目
git clone https://github.com/mbdtf202-cyber/MantleMusicFi.git .
```

### 3. 配置环境变量

```bash
# 复制生产环境配置
cp .env.production .env.production.local

# 编辑配置文件
nano .env.production.local
```

**重要配置项：**
```bash
# 域名配置
DOMAIN=your-domain.com
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com/api

# 数据库密码（必须修改）
MONGO_ROOT_PASSWORD=your-strong-password-123
REDIS_PASSWORD=your-redis-password-456

# JWT密钥（必须修改）
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# 区块链配置
PRIVATE_KEY=your-private-key
CONTRACT_ADDRESS=your-contract-address

# API密钥
OPENAI_API_KEY=your-openai-key
HUGGINGFACE_API_KEY=your-huggingface-key
```

### 4. 执行部署

```bash
# 给部署脚本执行权限
chmod +x scripts/deploy-cloud.sh

# 执行部署
./scripts/deploy-cloud.sh
```

## ☁️ 云平台部署

### AWS 部署

#### 使用 EC2 + RDS + ElastiCache

```bash
# 1. 创建 EC2 实例
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --instance-type t3.large \
    --key-name your-key-pair \
    --security-group-ids sg-xxxxxxxxx \
    --subnet-id subnet-xxxxxxxxx

# 2. 创建 RDS MongoDB 兼容实例
aws docdb create-db-cluster \
    --db-cluster-identifier mantlemusic-cluster \
    --engine docdb \
    --master-username admin \
    --master-user-password your-password

# 3. 创建 ElastiCache Redis
aws elasticache create-cache-cluster \
    --cache-cluster-id mantlemusic-redis \
    --engine redis \
    --cache-node-type cache.t3.micro
```

#### 使用 ECS Fargate

```yaml
# ecs-task-definition.json
{
  "family": "mantlemusic",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "ghcr.io/mbdtf202-cyber/mantlemusicfi-frontend:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ]
    }
  ]
}
```

### 阿里云部署

```bash
# 使用阿里云容器服务 ACK
aliyun cs CreateCluster \
    --name mantlemusic-cluster \
    --cluster-type ManagedKubernetes \
    --region cn-hangzhou \
    --worker-instance-types ecs.c6.large
```

### 腾讯云部署

```bash
# 使用腾讯云容器服务 TKE
tccli tke CreateCluster \
    --ClusterName mantlemusic \
    --ClusterType MANAGED_CLUSTER \
    --Region ap-beijing
```

## 🌐 域名和SSL配置

### 1. DNS 配置

在您的域名提供商处添加以下记录：

```
A     @              your-server-ip
A     www            your-server-ip
A     api            your-server-ip
A     ai             your-server-ip
A     monitoring     your-server-ip
CNAME *.your-domain  your-domain.com
```

### 2. Let's Encrypt SSL证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Cloudflare 配置（推荐）

```bash
# 1. 将域名DNS指向Cloudflare
# 2. 在Cloudflare中添加A记录指向服务器IP
# 3. 启用SSL/TLS加密模式为"完全"
# 4. 启用"始终使用HTTPS"
# 5. 配置页面规则进行缓存优化
```

## 📊 监控和维护

### 1. 监控服务访问

- **Grafana**: `https://monitoring.your-domain.com`
- **Prometheus**: `https://monitoring.your-domain.com/prometheus`
- **Kibana**: `https://monitoring.your-domain.com:5601`

### 2. 日常维护命令

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 更新应用
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 备份数据
./scripts/backup.sh

# 清理系统
docker system prune -f
```

### 3. 性能优化

```bash
# 调整系统参数
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
echo 'fs.file-max=65536' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 优化Docker
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

## 🔧 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 检查容器日志
docker logs container-name

# 检查资源使用
docker stats

# 检查网络连接
docker network ls
docker network inspect mantlemusic-network
```

#### 2. 数据库连接失败
```bash
# 检查MongoDB状态
docker exec -it mantlemusic-mongodb-prod mongosh

# 检查Redis状态
docker exec -it mantlemusic-redis-prod redis-cli ping
```

#### 3. SSL证书问题
```bash
# 检查证书状态
openssl x509 -in ssl/cert.pem -text -noout

# 重新生成证书
sudo certbot renew --force-renewal
```

#### 4. 性能问题
```bash
# 检查系统资源
htop
df -h
free -h

# 检查Docker资源使用
docker stats --no-stream
```

### 紧急恢复

#### 从备份恢复
```bash
# 停止服务
docker-compose -f docker-compose.prod.yml down

# 恢复MongoDB
tar -xzf backup_file.tar.gz
mongorestore --uri="mongodb://username:password@localhost:27017/mantlemusic" backup_dir/mongodb

# 恢复Redis
docker exec -i mantlemusic-redis-prod redis-cli --rdb /data/dump.rdb < backup_dir/redis_dump.rdb

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 支持和联系

如果在部署过程中遇到问题，请：

1. 查看项目 [Issues](https://github.com/mbdtf202-cyber/MantleMusicFi/issues)
2. 提交新的 Issue 描述问题
3. 联系项目维护者

---

## 🎉 部署完成

恭喜！您的 MantleMusicFi 项目现在已经成功部署到云端并可以通过公网访问了！

**访问地址：**
- 主站: `https://your-domain.com`
- API: `https://your-domain.com/api`
- 监控: `https://monitoring.your-domain.com`

记得定期备份数据和更新系统！