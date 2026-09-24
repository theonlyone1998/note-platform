#!/bin/bash
set -euo pipefail

export PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin
export HOME=/home/www

BRANCH="main"
GIT_PATH="/www/wwwroot/note-platform"
GIT_REMOTE="git@github.com:theonlyone1998/note-platform.git"
NGINX_CONF_SRC="${GIT_PATH}/nginx.http.conf"
NGINX_CONF_DST="/www/server/panel/vhost/nginx/note-platform.conf"
CLIENT_DIST="${GIT_PATH}/client/dist"

log() {
  echo ""
  echo "=============================="
  echo "$1 $(date '+%Y-%m-%d %H:%M:%S')"
  echo "=============================="
}

log "开始部署"

# 1. 确保目录存在
if [ ! -d "$GIT_PATH" ]; then
  echo "目录不存在，开始克隆仓库"
  mkdir -p "$GIT_PATH"
  chown -R www:www "$GIT_PATH"
  sudo -u www git clone "$GIT_REMOTE" "$GIT_PATH"
  if [ $? -ne 0 ]; then
    echo "仓库克隆失败"
    exit 1
  fi
fi

cd "$GIT_PATH" || exit 1

# 2. 拉取最新代码
sudo -u www git config --global --add safe.directory "$GIT_PATH" 2>/dev/null || true
echo "拉取最新代码"
sudo -u www git fetch origin "$BRANCH"
sudo -u www git reset --hard "origin/$BRANCH"

# 3. 安装依赖
# 先修正权限，pnpm install 可能需要写文件
chown -R www:www "$GIT_PATH"
echo "安装依赖"
sudo -u www pnpm install

# 4. 构建前端
echo "构建前端"
rm -f "${CLIENT_DIST}/.user.ini"
sudo -u www pnpm build:client

# 5. 停掉 PM2 老进程（如果之前用 PM2 启动过）
if /usr/local/nodejs20/lib/node_modules/pm2/bin/pm2 describe note-platform >/dev/null 2>&1; then
  echo "停掉 PM2 旧进程"
  /usr/local/nodejs20/lib/node_modules/pm2/bin/pm2 delete note-platform || true
fi

# 6. 启动 MySQL、Redis、后端服务
# server 服务会自动重新构建镜像
echo "启动容器服务"
docker compose down server 2>/dev/null || true
docker compose up -d --build server

# 7. 等待 MySQL 就绪
echo "等待 MySQL 就绪..."
docker compose exec mysql mysqladmin ping -h localhost -uroot -proot123456 --silent || {
  echo "MySQL 未就绪，等待 10 秒后重试..."
  sleep 10
  docker compose exec mysql mysqladmin ping -h localhost -uroot -proot123456 --silent
}

# 8. 部署 Nginx 配置
echo "部署 Nginx 配置"
cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
/www/server/nginx/sbin/nginx -t
/etc/init.d/nginx reload

# 9. 最终权限修正
chown -R www:www "$GIT_PATH"

log "部署完成"

echo ""
echo "访问地址: http://http://123.207.233.238/"
echo "健康检查: curl http://http://123.207.233.238//api/health"
