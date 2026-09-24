# 纸间笔记平台 - 宝塔面板 HTTP 单机部署指南

本文档描述如何在一台云服务器上完成部署，使用宝塔 Nginx 统一入口、Docker Compose 运行后端与数据层。

> 当前方案为 **HTTP 无域名临时方案**，通过 IP 即可访问。后续若要切换 HTTPS，请修改 `nginx.http.conf` 为 `nginx.conf` 并配置 SSL 证书。

---

## 一、准备一台云服务器

推荐配置：
- 2 核 CPU / 4 GB 内存 / 60 GB SSD（最低可压到 2C2G，仅自己用）
- 公网 IP，开放 22、80 端口（443 可选，切换 HTTPS 时需要）
- 操作系统：OpenCloudOS / CentOS 8+ / Ubuntu 22.04 LTS

购买后先更新系统并安装工具：

```bash
# CentOS/RHEL/OpenCloudOS
sudo dnf update -y
sudo dnf install -y git curl nginx

# 宝塔面板会自行管理 Nginx，如果你使用宝塔，可以跳过系统包里的 nginx
```

---

## 二、安装 Node.js、pnpm、Docker

### 2.1 Node.js 20 LTS

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v  # v20.x.x
```

### 2.2 pnpm

```bash
npm install -g pnpm
pnpm -v  # 8.x 或 9.x 均可
```

### 2.3 Docker + Docker Compose

```bash
# 一键安装（可换国内镜像源）
curl -fsSL https://get.docker.com | sudo bash -
sudo usermod -aG docker $USER
newgrp docker

docker -v
docker compose version
```

---

## 三、克隆代码到服务器

```bash
sudo mkdir -p /www/wwwroot/note-platform
sudo chown $USER:$USER /www/wwwroot/note-platform
cd /www/wwwroot/note-platform
git clone <你的仓库地址> .
```

---

## 四、配置生产环境变量

```bash
cp server/.env.example server/.env.production
nano server/.env.production
```

`server/.env.production` 示例（**部署前务必替换 JWT_SECRET**）：

```bash
NODE_ENV=production
PORT=3000

# 本机 docker-compose 起的 MySQL/Redis
DATABASE_URL=mysql://note_user:note_pass@127.0.0.1:3306/note_platform
REDIS_URL=redis://127.0.0.1:6379

# JWT 密钥，必须强随机，生成命令：openssl rand -hex 32
JWT_SECRET=你的64位十六进制强密钥
JWT_EXPIRES_IN=7d
```

> **安全警告**：`JWT_SECRET` 不要用默认字符串。请执行 `openssl rand -hex 32` 重新生成。`server/.env` 仅用于本地开发，`server/.env.production` 用于生产部署。

---

## 五、执行一键部署

```bash
cd /www/wwwroot/note-platform
chmod +x deploy.sh
sudo bash deploy.sh
```

`deploy.sh` 会按顺序执行：

1. `git pull`
2. `pnpm install`
3. `pnpm build:client`
4. `docker compose up -d --build server`（同时带起 mysql、redis）
5. 等待 MySQL 就绪
6. 部署宝塔 Nginx 配置并重载

---

## 六、验证部署

### 6.1 容器状态

```bash
docker compose ps
```

应看到 `server`、`mysql`、`redis` 都在运行。

### 6.2 后端健康检查

```bash
curl -s http://<你的服务器IP>/api/health
# 期望输出：{"code":200,"data":"ok","msg":"success"}
```

### 6.3 前端页面

浏览器访问 `http://<你的服务器IP>`，应能打开登录页。

### 6.4 Nginx 状态

```bash
/www/server/nginx/sbin/nginx -t
/etc/init.d/nginx status
```

---

## 七、后续更新代码

只需要在服务器执行：

```bash
cd /www/wwwroot/note-platform
sudo bash deploy.sh
```

---

## 八、常见问题

### Q1：MySQL 连接不上

- 确认 `server/.env.production` 的 `DATABASE_URL` 指向正确。
- 确认 `note-platform-mysql` 已启动：`docker compose ps`。
- 进入 MySQL 容器检查用户权限。

### Q2：前端刷新 404

- 检查 `nginx.http.conf` 里的 `try_files $uri $uri/ /index.html;` 是否生效。
- 确认 `client/dist/index.html` 存在。

### Q3：数据库数据会不会丢？

- MySQL 和 Redis 数据卷在 `/www/wwwroot/note-platform/docker-volumes/` 下。
- **建议**：定期备份 MySQL 数据卷，或直接使用云数据库。

---

## 九、安全加固建议（可选但强烈建议）

1. **禁用 root 密码登录**，改用 SSH 密钥登录。
2. **开启服务器防火墙**，仅开放 22、80、443。
3. **定期备份 MySQL**：
   ```bash
   docker compose exec mysql mysqldump -uroot -proot123456 note_platform > backup.sql
   ```
4. **限制后端暴露范围**：后端使用 host 网络模式，但实际只通过 Nginx 的 `/api/` 反向代理访问。
5. **使用 fail2ban** 防止暴力破解 SSH。

---

## 十、如果想回滚

```bash
cd /www/wwwroot/note-platform

docker compose down server
git reset --hard HEAD~1
sudo bash deploy.sh
```
