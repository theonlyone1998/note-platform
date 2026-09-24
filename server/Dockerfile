FROM node:20-slim

# Prisma 迁移需要 OpenSSL 支持
# 国内服务器将 Debian 源切换为阿里云镜像，避免 DNS 或网络不稳定导致 apt 失败
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources \
    && sed -i 's/security.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

RUN pnpm install --frozen-lockfile

COPY server ./server
COPY shared ./shared

WORKDIR /app/server
RUN pnpm db:generate
RUN pnpm build

EXPOSE 3000

CMD ["sh", "-c", "pnpm migrate:deploy && pnpm start"]
