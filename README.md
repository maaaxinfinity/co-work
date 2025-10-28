Co-Work 是一个基于 Next.js 15 + React 19 + Drizzle ORM + PostgreSQL 的 AI 文档协作平台原型。本 README 覆盖本地开发、环境变量、安全与质量控制、常用脚本以及项目结构。

## 快速开始

1) 准备环境
- Node.js 18+，建议 20+
- PostgreSQL 实例，并准备 `DATABASE_URL`

2) 配置环境变量
- 新建 `.env.local`（不会被提交）：
```
DATABASE_URL=postgresql://user:password@localhost:5432/co_work
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
- 可参考 `.env.example`（若不存在，可自行创建）

3) 安装依赖并启动
```
npm install
npm run dev
```
访问 http://localhost:3000

## 重要脚本
- `npm run dev` 开发模式 (Turbopack)
- `npm run build` 生产构建（启用类型检查与 ESLint）
- `npm run start` 生产启动
- `npm run lint` 代码检查

## 安全与质量
- 已添加基础安全响应头（见 `next.config.ts`）
- API 写操作具备基本 Origin 校验与统一错误响应（见 `src/lib/server/response.ts`）
- 构建时开启类型检查与 ESLint（生产环境严格）
- `.gitignore` 已忽略 `.env*`，请勿提交任何密钥

## 项目结构（节选）
```
src/
  app/
    api/                 # REST API (Next.js Route Handlers)
  components/
    workspace/           # 业务组件（编辑器/聊天/文件树等）
  db/
    schema.ts            # Drizzle 表定义
    index.ts             # 数据库连接
  lib/
    api-client.ts        # 浏览器端 API 客户端
    server/response.ts   # API 通用响应/安全工具
```

## 开发者注意事项
- 提交代码前请运行 `npm run lint`，尽量避免 `any` 与未使用变量
- 开发环境可放宽类型错误；生产构建会阻断错误（见 `next.config.ts`）
- 若需要新增 API，请复用 `jsonError` 与 `checkOrigin`

## 后续路线
- 引入鉴权（NextAuth/BetterAuth）保护 API 与页面
- 文件树性能优化、AI 流式回复、E2E 测试与监控集成
