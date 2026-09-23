# 方案 A：最小单机部署实施计划

## 目标
在一台云服务器上，用 Docker 跑后端 + MySQL + Redis，Nginx 统一入口：静态文件走 `client/dist`，`/api/*` 反代到后端容器，实现同域名线上访问。

## 成功标准
1. `pnpm build:client && pnpm build:server` 在本地通过。
2. 服务器上 `bash deploy.sh` 一键完成构建、迁移、重启。
3. 浏览器访问 `https://<domain>` 能打开前端，登录/注册/笔记 CURD 正常。
4. 容器重启后数据不丢（MySQL/Redis 使用持久化卷）。

## 步骤与检查点

### 1. 前端生产配置（client 层）
- 创建 `client/.env.production`：`VITE_API_BASE_URL=/api`
- 确认 `client/vite.config.ts` 的 `base: '/'`（默认即 /，不修改）。
- 检查点：前端构建产物 `client/dist/index.html` 中 axios 请求路径为相对 `/api`。

### 2. 后端健康检查（server 层，小改动）
- 在 `server/src/router/index.ts` 增加 `GET /api/health`，返回 `{ code: 200, data: 'ok', msg: 'success' }`。
- 检查点：容器启动后 `curl http://localhost:3000/api/health` 返回 200。

### 3. 运维文件（新增，不影响业务代码）
- `nginx.conf`：HTTPS 入口配置，/api 反代到 server:3000，其余走 client/dist。
- `deploy.sh`：服务器端一键部署脚本（拉代码、构建前端、构建后端镜像、重启容器、Nginx reload）。
- `DEPLOY.md`：完整部署文档。

### 4. 本地预演
- 本地执行 `pnpm build:client` 和 `pnpm build:server`，确保无类型/构建错误。
- 检查点：产物目录存在 `client/dist`、`server/dist/server/src/main.js`。

### 5. 服务器部署
- 首次上云：安装 Docker + Docker Compose + Nginx。
- 上传或 SCP 项目代码到服务器。
- 创建 `server/.env`，填入真实数据库地址、Redis 地址、强 JWT_SECRET。
- 执行 `bash deploy.sh`。
- 检查点：容器状态 `docker ps` 全 Up；Nginx `systemctl status nginx` active；域名 HTTPS 可访问。

## 不做的范围
- 不改现有数据库 schema 和 migration。
- 不改业务路由结构（仅新增 /api/health）。
- 不使用对象存储/CDN（方案 B 才涉及）。
- 不做多机负载均衡。
