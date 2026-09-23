# 纸间笔记平台 - 方案 A：最小单机线上部署指南

本文档描述如何在一台云服务器上完成部署，使用 Nginx 统一入口、Docker 运行后端、本地/云 MySQL 与 Redis 作为数据层。

---

## 一、准备一台云服务器

推荐配置：
- 2 核 CPU / 4 GB 内存 / 60 GB SSD（最低可压到 2C2G，仅自己用）
- 公网 IP，开放 22、80、443 端口
- 操作系统：Ubuntu 22.04 LTS（推荐）或 CentOS 8+

购买后先更新系统并安装工具：

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx

# CentOS/RHEL
sudo dnf update -y
sudo dnf install -y git curl nginx certbot python3-certbot-nginx
```

---

## 二、安装 Node.js、pnpm、Docker

### 2.1 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # v20.x.x
```

### 2.2 pnpm

```bash
npm install -g pnpm
pnpm -v  # 8.x 或 9.x 均可
```

### 2.3 Docker + Docker Compose

```bash
# 一键安装（阿里云/腾讯云镜像可用国内源）
curl -fsSL https://get.docker.com | sudo bash -
sudo usermod -aG docker $USER
newgrp docker

docker -v
docker compose version
```

---

## 三、克隆代码到服务器

```bash
sudo mkdir -p /opt/note-platform
sudo chown $USER:$USER /opt/note-platform
cd /opt/note-platform
git clone <你的仓库地址> .
```

---

## 四、配置生产环境变量

复制示例文件并修改：

```bash
cp server/.env.example server/.env.production
nano server/.env.production
```

`server/.env.production` 内容示例（**务必替换为真实值**）：

```bash
NODE_ENV=production
PORT=3000

# 方式一：使用本机 docker-compose 起的 MySQL/Redis
DATABASE_URL=mysql://note_user:note_pass@127.0.0.1:3306/note_platform
REDIS_URL=redis://127.0.0.1:6379

# 方式二：使用云数据库/缓存（推荐生产环境）
# DATABASE_URL=mysql://用户名:密码@云数据库外网地址:3306/note_platform
# REDIS_URL=redis://:密码@云Redis地址:6379

# JWT 密钥，必须强随机，生成命令：openssl rand -hex 32
JWT_SECRET=你的64位十六进制强密钥
JWT_EXPIRES_IN=7d
```

> **安全警告**：`JWT_SECRET` 不要用默认字符串，不要用可猜测的单词。请执行 `openssl rand -hex 32` 生成。`server/.env` 仅用于本地开发，`server/.env.production` 用于生产部署，两者不要混用。

---

## 五、申请 SSL 证书（Let's Encrypt）

```bash
# 替换 your-domain.com 为你的真实域名
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

成功后证书会放在：

```
/etc/letsencrypt/live/your-domain.com/fullchain.pem
/etc/letsencrypt/live/your-domain.com/privkey.pem
```

---

## 六、修改部署脚本

打开 `deploy.sh`，修改顶部的域名和证书路径：

```bash
DOMAIN="your-domain.com"
CERT_PATH="/etc/letsencrypt/live/your-domain.com/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/your-domain.com/privkey.pem"
```

---

## 七、执行一键部署

```bash
cd /opt/note-platform
chmod +x deploy.sh
sudo bash deploy.sh
```

脚本会依次执行：

1. `git pull`
2. `pnpm install`
3. `pnpm build:client`
4. `pnpm build:server`（构建后端 Docker 镜像）
5. 启动 MySQL/Redis 容器（如果用的是本地数据库）
6. 启动后端 server 容器
7. 部署 Nginx 配置并重载

---

## 八、首次数据库迁移

如果你是第一次部署，需要手动执行 Prisma migrate：

```bash
# 进入本地 server 目录，用容器里的 Node 或直接本地 pnpm
cd /opt/note-platform/server
pnpm db:generate
npx prisma migrate deploy
```

后续更新代码时，`deploy.sh` 启动容器会自动运行 `pnpm migrate:deploy`，无需手动执行。

---

## 九、验证部署

### 9.1 容器状态

```bash
docker ps
```

应看到 `note-platform-server`、`note-platform-mysql`、`note-platform-redis` 都在运行。

### 9.2 后端健康检查

```bash
curl -s https://your-domain.com/api/health
# 期望输出：{"code":200,"data":"ok","msg":"success"}
```

### 9.3 前端页面

浏览器访问 `https://your-domain.com`，应能打开登录页。

### 9.4 Nginx 状态

```bash
sudo nginx -t
sudo systemctl status nginx
```

---

## 十、后续更新代码

更新只需要在服务器执行：

```bash
cd /opt/note-platform
sudo bash deploy.sh
```

---

## 十一、常见问题

### Q1：MySQL 连接不上

- 确认 `server/.env` 的 `DATABASE_URL` 指向正确。
- 如果是本机 docker-compose，确认 `note-platform-mysql` 已启动：`docker ps`。
- 确认 note_user 有权限：进入 MySQL 容器检查。

### Q2：前端刷新 404

- 检查 Nginx 配置里的 `try_files $uri $uri/ /index.html;` 是否生效。

### Q3：HTTPS 证书过期

- Let's Encrypt 证书 90 天过期，certbot 会自动续期。手动续期：

```bash
sudo certbot renew
```

### Q4：数据库数据会不会丢？

- 如果用本机 docker-compose，数据卷在 `/opt/note-platform/docker-volumes/mysql` 和 `.../redis`。
- **建议**：定期备份 MySQL 数据卷，或直接使用云数据库。

---

## 十二、安全加固建议（可选但强烈建议）

1. **禁用 root 密码登录**，改用 SSH 密钥登录。
2. **开启服务器防火墙**，仅开放 22、80、443。
3. **定期备份 MySQL**：
   ```bash
   docker exec note-platform-mysql mysqldump -uroot -proot123456 note_platform > backup.sql
   ```
4. **限制后端容器暴露范围**：`deploy.sh` 已绑定 `127.0.0.1:3000`，避免公网直连后端。
5. **使用 fail2ban** 防止暴力破解 SSH。

---

## 十三、如果想回滚

```bash
# 停止当前容器
docker stop note-platform-server
docker rm note-platform-server

# 回到上一个 git 提交
git reset --hard HEAD~1
sudo bash deploy.sh
```
