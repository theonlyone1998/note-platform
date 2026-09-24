# 个人笔记平台｜架构说明 + 完整实现步骤

项目采用 **Monorepo 单仓库**，前端 + 后端放同一个 git 仓库，方便管理共享类型，技术栈：

> 
> 前端：Vue3 + Vite + TypeScript
> 后端：Koa2 + TypeScript
> ORM：Prisma（MySQL）
> 缓存：Redis
> 部署：Nginx / Docker + docker-compose

## 一、目录架构文件说明

```
note-platform/
├── .gitignore
├── package.json                # monorepo 根包，管理脚本
├── docker-compose.yml          # 容器编排：后端 + mysql + redis
├── README.md                   # 项目介绍、本地启动、部署文档（写进简历重点）
├── client/                     # 前端项目
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── api/                # 请求封装，axios，接口调用
│   │   ├── types/              # 前端类型（可和后端共享）
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   ├── stores/
│   │   └── main.ts
│   └── dist/                   # 打包产物
├── server/                     # Koa 后端服务
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json            # 开发热重载
│   ├── src/
│   │   ├── main.ts             # 服务入口，创建Koa实例，注册中间件
│   │   ├── app.ts              # Koa app配置
│   │   ├── config/             # 配置文件：数据库、redis、端口
│   │   │   └── index.ts
│   │   ├── middleware/         # 自定义中间件
│   │   │   ├── error.ts        # 全局错误捕获
│   │   │   ├── response.ts     # 统一返回体封装
│   │   │   └── auth.ts         # 登录鉴权中间件
│   │   ├── router/             # 路由分层
│   │   │   ├── index.ts        # 路由汇总
│   │   │   ├── user.router.ts  # 用户注册登录
│   │   │   └── note.router.ts  # 笔记CRUD
│   │   ├── controller/         # 控制器，处理业务逻辑
│   │   │   ├── user.controller.ts
│   │   │   └── note.controller.ts
│   │   ├── service/             # 业务层（和数据库交互）
│   │   │   ├── user.service.ts
│   │   │   └── note.service.ts
│   │   ├── types/               # 后端TS类型、DTO
│   │   └── utils/               # 工具函数：加密、redis封装
│   └── prisma/                  # Prisma ORM
│       └── schema.prisma        # 数据库表结构定义
└── shared/                      # 【可选】前后端共享类型定义（强烈推荐）
    └── src/types/index.ts
```

### 核心文件职责简要说明

1. `server/src/main.ts`：程序入口，启动 http 服务
2. `server/src/app.ts`：加载 koa 中间件（cors、bodyparser、日志、鉴权、全局错误）
3. `router`：只做路由分发，**不要写业务**，业务交给 controller
4. `controller`：接收请求，参数校验，调用 service，组装返回结果
5. `service`：纯业务逻辑、数据库操作，不接触 ctx 请求对象（分层思想）
6. `middleware/response.ts`：统一返回格式，成功 `{code:200,data,msg}`；错误 `{code:xxx,msg}`
7. `prisma/schema.prisma`：定义 User、Note 模型，执行迁移自动建表
8. `docker-compose.yml`：一次性拉起 mysql、redis、node 后端，本地环境一键启动
9. `shared`：存放接口 DTO，前端直接导入，保证前后端类型一致，解决联调字段不一致问题