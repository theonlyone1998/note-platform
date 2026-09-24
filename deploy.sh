#!/usr/bin/env bash
# 纸间笔记平台 - 宝塔面板 HTTP 单机一键部署脚本（无域名临时方案）
# 前置要求：
#   1. 宝塔面板已安装 Nginx
#   2. 项目代码在 /www/wwwroot/note-platform
#   3. 已配置 server/.env.production
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

echo "[1/6] 拉取最新代码..."
git pull || true

echo "[2/6] 安装依赖..."
pnpm install

echo "[3/6] 构建前端..."
rm -f "${CLIENT_DIST}/.user.ini"
pnpm build:client

echo "[4/6] 构建并启动 MySQL、Redis、后端服务..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo "[5/6] 等待 MySQL 就绪..."
docker compose exec mysql mysqladmin ping -h localhost -uroot -proot123456 --silent || {
  echo "MySQL 未就绪，等待 10 秒后重试..."
  sleep 10
  docker compose exec mysql mysqladmin ping -h localhost -uroot -proot123456 --silent
}

echo "[6/6] 部署 Nginx 配置..."
cp "${NGINX_CONF_SRC}" "${NGINX_CONF_DST}"
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

/www/server/nginx/sbin/nginx -t
/etc/init.d/nginx reload

echo ""
echo "部署完成！"
echo "访问地址: http://123.207.233.238"
echo "健康检查: curl http://123.207.233.238/api/health"
