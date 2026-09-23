FROM node:20-slim

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
