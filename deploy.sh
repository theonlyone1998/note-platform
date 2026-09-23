#!/usr/bin/env bash
# 纸间笔记平台 - 宝塔面板 HTTP 单机一键部署脚本（无域名临时方案）
# 前置要求：
#   1. 宝塔面板已安装 Nginx、MySQL
#   2. 项目代码在 /www/wwwroot/note-platform
#   3. 已配置 server/.env
#
# 使用方法：
#   chmod +x deploy.sh
#   bash deploy.sh

set -euo pipefail

# --- 配置区（按实际情况修改） ---
PROJECT_DIR="/www/wwwroot/note-platform"
CLIENT_DIST="${PROJECT_DIR}/client/dist"
NGINX_CONF_SRC="${PROJECT_DIR}/nginx.http.conf"
NGINX_CONF_DST="/www/server/panel/vhost/nginx/note-platform.conf"

# --- 脚本正文 ---
cd "${PROJECT_DIR}"

echo "[1/5] 安装依赖..."
pnpm install

echo "[2/5] 构建前端..."
rm -f "${CLIENT_DIST}/.user.ini"
pnpm build:client

echo "[3/5] 构建后端 Docker 镜像..."
docker build -t note-platform-server -f server/Dockerfile .

echo "[4/5] 启动 Redis..."
docker compose up -d redis || true

echo "[5/5] 启动后端服务容器..."
docker stop note-platform-server 2>/dev/null || true
docker rm note-platform-server 2>/dev/null || true

docker run -d \
  --name note-platform-server \
  --network host \
  -p 127.0.0.1:3000:3000 \
  --env-file "${PROJECT_DIR}/server/.env.production" \
  --restart unless-stopped \
  note-platform-server

echo "[5/5] 部署 Nginx 配置..."
cp "${NGINX_CONF_SRC}" "${NGINX_CONF_DST}"
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

/www/server/nginx/sbin/nginx -t
/etc/init.d/nginx reload

echo ""
echo "部署完成！"
echo "访问地址: http://你的服务器IP"
echo "后端 API: http://你的服务器IP/api"
echo "健康检查: curl http://你的服务器IP/api/health"
