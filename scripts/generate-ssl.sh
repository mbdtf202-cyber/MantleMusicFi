#!/bin/bash

# 生成自签名SSL证书脚本（仅用于开发环境）
set -e

echo "🔐 生成自签名SSL证书..."

# 创建SSL目录
mkdir -p ssl

# 生成私钥
openssl genrsa -out ssl/private.key 2048

# 生成证书签名请求
openssl req -new -key ssl/private.key -out ssl/certificate.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# 生成自签名证书
openssl x509 -req -days 365 -in ssl/certificate.csr -signkey ssl/private.key -out ssl/certificate.crt

# 清理临时文件
rm ssl/certificate.csr

echo "✅ SSL证书生成完成"
echo "📁 证书位置: ssl/certificate.crt"
echo "🔑 私钥位置: ssl/private.key"
echo ""
echo "⚠️  注意：这是自签名证书，仅适用于开发环境"
echo "   生产环境请使用Let's Encrypt或其他CA签发的证书"