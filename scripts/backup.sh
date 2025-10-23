#!/bin/bash

# ===========================================
# MantleMusicFi 自动备份脚本
# ===========================================

set -e

# 配置
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mantlemusic_backup_${TIMESTAMP}"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 创建备份目录
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

log "开始备份 MantleMusicFi 数据..."

# 备份MongoDB
log "备份 MongoDB 数据库..."
mongodump \
    --uri="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/mantlemusic?authSource=admin" \
    --out="${BACKUP_DIR}/${BACKUP_NAME}/mongodb"

# 备份Redis
log "备份 Redis 数据..."
redis-cli -h redis -a "${REDIS_PASSWORD}" --rdb "${BACKUP_DIR}/${BACKUP_NAME}/redis_dump.rdb"

# 备份配置文件
log "备份配置文件..."
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/config"
cp /scripts/../.env.production "${BACKUP_DIR}/${BACKUP_NAME}/config/" 2>/dev/null || true
cp /scripts/../docker-compose.prod.yml "${BACKUP_DIR}/${BACKUP_NAME}/config/" 2>/dev/null || true
cp /scripts/../nginx.prod.conf "${BACKUP_DIR}/${BACKUP_NAME}/config/" 2>/dev/null || true

# 创建备份信息文件
cat > "${BACKUP_DIR}/${BACKUP_NAME}/backup_info.txt" << EOF
备份时间: $(date)
备份类型: 完整备份
数据库: MongoDB + Redis
配置文件: 已包含
备份大小: $(du -sh "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
EOF

# 压缩备份
log "压缩备份文件..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

# 上传到云存储（如果配置了AWS）
if [ ! -z "${AWS_ACCESS_KEY_ID}" ] && [ ! -z "${S3_BUCKET_NAME}" ]; then
    log "上传备份到 S3..."
    aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "s3://${S3_BUCKET_NAME}/backups/${BACKUP_NAME}.tar.gz"
    
    if [ $? -eq 0 ]; then
        log "备份已成功上传到 S3"
        # 如果上传成功，可以删除本地备份文件以节省空间
        # rm "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    else
        log "S3 上传失败，保留本地备份"
    fi
fi

# 清理旧备份
log "清理 ${RETENTION_DAYS} 天前的备份..."
find "${BACKUP_DIR}" -name "mantlemusic_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# 清理S3中的旧备份（如果配置了AWS）
if [ ! -z "${AWS_ACCESS_KEY_ID}" ] && [ ! -z "${S3_BUCKET_NAME}" ]; then
    aws s3 ls "s3://${S3_BUCKET_NAME}/backups/" | while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d "$createDate" +%s)
        olderThan=$(date -d "${RETENTION_DAYS} days ago" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo $line | awk '{print $4}')
            if [[ $fileName != "" ]]; then
                aws s3 rm "s3://${S3_BUCKET_NAME}/backups/${fileName}"
                log "删除S3中的旧备份: ${fileName}"
            fi
        fi
    done
fi

log "备份完成: ${BACKUP_NAME}.tar.gz"
log "备份大小: $(du -sh "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)"