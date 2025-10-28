# Co-Work 项目总结

## 项目概览
**Co-Work** 是一个基于 Next.js 15 + React 19 的 **AI 文档协作平台原型**，集成 Drizzle ORM + PostgreSQL，支持实时文档编辑、AI 对话、文件管理和团队协作功能。

## 技术栈

### 核心框架
- **Next.js 15.3.5**: App Router + Turbopack 开发模式
- **React 19**: 函数式组件 + Hooks
- **TypeScript 5**: 严格类型检查

### 数据层
- **Drizzle ORM 0.44.6**: 类型安全的 SQL 查询构建器
- **PostgreSQL**: 通过 postgres 库连接（DATABASE_URL 必须配置）
- **数据库配置**: `drizzle.config.ts` + 迁移目录 `drizzle/`

### UI 组件库
- **Radix UI**: 无障碍组件库（Dialog、Dropdown、Tabs 等 30+ 组件）
- **Tailwind CSS 4**: 原子化 CSS + 自定义主题
- **Framer Motion**: 动画效果
- **Lucide React**: 图标库
- **shadcn/ui 风格**: 基于 Radix 的定制化组件（`src/components/ui/`）

### 编辑器
- **Monaco Editor** (`@monaco-editor/react`): 代码编辑
- **Canvas Editor** (`@hufe921/canvas-editor`): DOCX 富文本编辑
- **Markdown Editor** (`@uiw/react-markdown-editor`): Markdown 编辑

### 认证与安全
- **自定义会话系统**: 基于 Cookie (`cw_session`) + PostgreSQL sessions 表
- **密码加密**: PBKDF2 (120k 迭代 + SHA512)
- **安全响应头**: 在 `next.config.ts` 中配置（X-Frame-Options、CSP 等）
- **API 防护**: Origin 校验 + 统一错误响应（`src/lib/server/response.ts`）

### 其他依赖
- **Zod**: 数据校验
- **React Hook Form**: 表单管理
- **Sonner**: Toast 通知
- **Three.js / React Three Fiber**: 3D 可视化（实验性）

## 项目结构

```
co-work/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (app)/                     # 认证后应用路由
│   │   │   ├── workspace/page.tsx     # 主工作区
│   │   │   ├── dashboard/page.tsx     # 仪表盘
│   │   │   ├── admin/users/page.tsx   # 用户管理
│   │   │   └── layout.tsx             # 应用布局壳
│   │   ├── api/                       # REST API 路由处理器
│   │   │   ├── auth/                  # 认证 API（login/register/logout/session）
│   │   │   ├── projects/route.ts      # 项目 CRUD
│   │   │   ├── files/route.ts         # 文件管理
│   │   │   ├── messages/route.ts      # AI 聊天消息
│   │   │   ├── comments/route.ts      # 文档评论
│   │   │   ├── tasks/route.ts         # AI 任务
│   │   │   ├── versions/route.ts      # 文件版本历史
│   │   │   ├── project-members/route.ts # 项目成员
│   │   │   └── message-context-files/route.ts # 消息关联文件
│   │   ├── auth/                      # 认证页面
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── page.tsx                   # 主页
│   │   ├── layout.tsx                 # 根布局（含 Providers）
│   │   ├── providers.tsx              # 全局 Provider 组合
│   │   └── globals.css                # 全局样式
│   │
│   ├── components/                    # React 组件
│   │   ├── workspace/                 # 工作区核心组件
│   │   │   ├── WorkspaceLayout.tsx    # 工作区主布局（三栏结构）
│   │   │   ├── FileBrowser.tsx        # 文件树导航
│   │   │   ├── EditorArea.tsx         # 编辑器区域
│   │   │   ├── ChatPanel.tsx          # AI 聊天面板
│   │   │   ├── TopNavBar.tsx          # 顶部导航栏
│   │   │   └── editors/               # 不同文件类型编辑器
│   │   │       ├── MarkdownEditor.tsx
│   │   │       ├── DocxEditor.tsx
│   │   │       └── TextEditor.tsx
│   │   ├── layout/                    # 布局组件
│   │   │   ├── SiteHeader.tsx         # 站点头部
│   │   │   └── AppShell.tsx           # 应用外壳
│   │   ├── auth/                      # 认证表单
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── ui/                        # 通用 UI 组件（50+ 个）
│   │   │   ├── button.tsx             # shadcn 风格按钮
│   │   │   ├── dialog.tsx             # 对话框
│   │   │   ├── input.tsx              # 输入框
│   │   │   └── ...（基于 Radix UI）
│   │   └── ErrorReporter.tsx          # 错误边界
│   │
│   ├── db/                            # 数据库层
│   │   ├── schema.ts                  # Drizzle 表定义（10 个表）
│   │   ├── index.ts                   # 数据库连接实例
│   │   └── seeds/                     # 数据库种子文件
│   │       ├── users.ts
│   │       ├── projects.ts
│   │       ├── files.ts
│   │       ├── messages.ts
│   │       ├── comments.ts
│   │       ├── tasks.ts
│   │       └── versions.ts
│   │
│   ├── lib/                           # 工具库
│   │   ├── server/                    # 服务端工具
│   │   │   ├── auth.ts                # 认证逻辑（会话/密码）
│   │   │   └── response.ts            # API 响应助手
│   │   ├── constants/                 # 常量定义
│   │   │   └── access-control.ts      # 角色/区域常量
│   │   ├── api-client.ts              # 前端 API 客户端（统一封装）
│   │   └── utils.ts                   # 通用工具函数
│   │
│   ├── hooks/                         # 自定义 Hooks
│   │   ├── useWorkspaceStore.tsx      # 工作区状态管理（Context API）
│   │   ├── useAuth.tsx                # 认证状态 Hook
│   │   └── use-mobile.ts              # 响应式判断
│   │
│   └── visual-edits/                  # 可视化编辑工具（实验性）
│       ├── VisualEditsMessenger.tsx
│       └── component-tagger-loader.js
│
├── drizzle/                           # Drizzle 迁移文件（自动生成，勿手动修改）
├── public/                            # 静态资源
├── next.config.ts                     # Next.js 配置（安全头、Turbopack 规则）
├── drizzle.config.ts                  # Drizzle ORM 配置
├── tsconfig.json                      # TypeScript 配置（严格模式 + 路径别名 @/*）
├── eslint.config.mjs                  # ESLint 配置
├── package.json                       # 依赖清单
├── components.json                    # shadcn/ui 组件配置
├── dev-setup.sh                       # 开发环境初始化脚本
├── AGENTS.md                          # 代码规范和开发指南
└── README.md                          # 项目文档

```

## 数据库模型（10 个表）

### 核心实体
1. **users**: 用户信息（id, name, email, passwordHash, role, region, avatarUrl）
2. **sessions**: 登录会话（id, userId, token, expiresAt）
3. **projects**: 项目（id, name, status, createdAt, updatedAt）
4. **projectMembers**: 项目成员关系（projectId, userId, role）

### 文件与内容
5. **files**: 文件树结构（支持团队/私有）
   - 字段：projectId, parentId, name, type, fileType, content, ownerType, ownerId, status
   - 支持类型：file/folder, docx/md/txt/code/image
   - 所有权：team（只读）/ private（可编辑）

6. **versions**: 文件版本历史（fileId, title, author, content）
7. **comments**: 文档评论（fileId, parentCommentId, author, content, resolved）
8. **tasks**: AI 任务（fileId, title, status）

### AI 对话
9. **messages**: AI 聊天消息（projectId, role, content, quotedMessageId, pinned）
10. **messageContextFiles**: 消息关联的上下文文件（messageId, fileId）

## 核心功能

### 1. 用户认证
- **注册**: POST `/api/auth/register` (name, email, password, region)
- **登录**: POST `/api/auth/login` (email, password) → 返回 Cookie 会话
- **登出**: POST `/api/auth/logout`
- **会话**: GET `/api/auth/session` → 当前用户信息
- **密码加密**: PBKDF2 (120k 迭代, SHA512, 16 字节 salt)
- **会话有效期**: 7 天

### 2. 文件管理
- **文件树**: 支持无限层级的文件夹嵌套
- **所有权模型**:
  - `team` 文件：所有项目成员只读
  - `private` 文件：仅创建者可编辑/删除/重命名
- **操作**: 创建、重命名、删除、移动、更新内容
- **状态**: synced（已同步）/ modified（已修改）/ new（新建）
- **文件类型**: docx, md, txt, code, image

### 3. 编辑器集成
- **Markdown**: `@uiw/react-markdown-editor` + 实时预览
- **DOCX**: `@hufe921/canvas-editor` 富文本编辑
- **代码**: Monaco Editor（VSCode 内核）
- **自动保存**: 内容变更后通过 `updateFileContent` API 保存

### 4. AI 对话
- **聊天面板**: 支持用户-AI 对话流
- **消息功能**: 发送、引用回复、置顶
- **上下文关联**: 通过 `messageContextFiles` 关联文件到对话
- **模拟 AI**: 当前使用静态回复（待接入真实 LLM）

### 5. 协作功能
- **项目成员**: 多用户可加入同一项目
- **评论系统**: 支持文档内评论 + 嵌套回复 + 解决标记
- **版本历史**: 文件变更记录
- **任务管理**: AI 生成的任务列表（pending/in_progress/completed）

### 6. 安全机制
- **Origin 校验**: API 写操作检查 Origin 头
- **SQL 注入防护**: 使用 Drizzle ORM 参数化查询
- **XSS 防护**: 响应头配置 `X-Content-Type-Options: nosniff`
- **CSRF 基础防护**: SameSite Cookie
- **角色权限**: admin/operator/user 三级角色（待完整实现）
- **区域隔离**: 34 个中国省级行政区 + 港澳台

## 开发工作流

### 环境配置
```bash
# 1. 安装依赖
npm install  # 或 bun install

# 2. 配置环境变量（.env.local）
DATABASE_URL=postgresql://user:password@localhost:5432/co_work
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 3. 运行数据库迁移
bunx drizzle-kit push  # 或 npx drizzle-kit push

# 4. 启动开发服务器
npm run dev  # http://localhost:3000
```

### 常用脚本
- `npm run dev`: Turbopack 开发模式（热更新）
- `npm run build`: 生产构建（严格类型检查 + ESLint）
- `npm run start`: 启动生产服务器
- `npm run lint`: ESLint 检查
- `npm run lint:fix`: 自动修复 ESLint 问题
- `npm run typecheck`: TypeScript 类型检查

### 代码规范
- **缩进**: 2 空格
- **引号**: 单引号（非 JSX）
- **组件命名**: PascalCase（`WorkspaceLayout.tsx`）
- **工具/钩子**: camelCase（`useWorkspace`, `api-client.ts`）
- **路由文件夹**: kebab-case（`project-members/`）
- **导入顺序**: 框架 → 第三方库 → 本地模块（使用 `@/` 别名）
- **TypeScript**: 严格模式，禁止 `any`（除非必要）

### 数据库变更流程
1. 修改 `src/db/schema.ts`
2. 运行 `bunx drizzle-kit generate` 生成迁移 SQL
3. 运行 `bunx drizzle-kit push` 应用到数据库
4. **禁止手动编辑** `drizzle/` 目录

### 提交规范
- **格式**: Conventional Commits（`feat:`, `fix:`, `refactor:` 等）
- **原则**: 单一职责（不混合功能和重构）
- **必须**: 提交前通过 `npm run lint` 和 `npm run typecheck`

## 状态管理架构

### WorkspaceContext (`useWorkspaceStore.tsx`)
- **状态**: 
  - `projectId`: 当前项目 ID
  - `teamFiles/privateFiles`: 文件树数据
  - `selectedFileId`: 选中的文件 ID
  - `messages`: AI 对话历史
  - `globalSearch`: 全局搜索关键词
  - `shareDialogOpen`: 分享对话框状态

- **操作**:
  - `selectFile`: 切换选中文件
  - `renameFile/deleteFile/addFile/moveFile`: 文件 CRUD
  - `sendMessage/pinMessage`: 消息操作
  - `updateFileContent`: 自动保存内容
  - `refreshFiles/refreshMessages`: 重新加载数据

### AuthContext (`useAuth.tsx`)
- 管理登录状态和用户信息
- 与 `/api/auth/session` 同步

## API 路由规范

### RESTful 风格
- **GET**: 查询（支持 `id` 或列表参数）
- **POST**: 创建（需要 Origin 校验）
- **PUT**: 更新（通过 `?id=` 定位）
- **DELETE**: 删除（通过 `?id=` 定位）

### 错误响应格式
```json
{
  "error": "错误描述",
  "code": "ERROR_CODE"  // 可选
}
```

### Origin 校验（写操作）
```typescript
import { checkOrigin } from '@/lib/server/response';

export async function POST(request: NextRequest) {
  const originCheck = checkOrigin(request);
  if (originCheck) return originCheck;  // 返回 403
  // ... 业务逻辑
}
```

## 待完善功能

### 高优先级
1. **真实 AI 集成**: 接入 OpenAI/Claude API，实现流式回复
2. **实时协作**: WebSocket 或 Server-Sent Events 同步编辑
3. **权限系统**: 基于角色的访问控制（RBAC）实现
4. **文件上传**: 完善 `/api/files/upload` 接口（图片、附件）

### 中优先级
5. **测试覆盖**: 单元测试（Jest）+ E2E 测试（Playwright）
6. **性能优化**: 
   - 文件树虚拟滚动（react-window）
   - API 响应缓存（Redis）
   - 代码分割优化
7. **国际化**: i18n 支持（当前仅中文）
8. **暗色主题**: next-themes 主题切换

### 低优先级
9. **监控集成**: Sentry 错误追踪
10. **CI/CD**: GitHub Actions 自动部署
11. **文档生成**: API 文档（Swagger/OpenAPI）
12. **移动端适配**: 响应式布局优化

## 安全注意事项

### 已实现
- HTTPS 强制（生产环境 Cookie `secure: true`）
- 密码哈希存储（PBKDF2）
- SQL 注入防护（Drizzle ORM）
- XSS 响应头（X-Frame-Options, CSP）
- CSRF 基础防护（SameSite Cookie）

### 需加强
- **API 鉴权**: 当前部分 API 未校验登录状态
- **速率限制**: 防止暴力破解和 DDoS
- **敏感信息**: 审计日志中可能存在的密码泄露
- **依赖更新**: 定期扫描漏洞（`npm audit`）
- **环境隔离**: 区分开发/测试/生产数据库

## 部署建议

### Vercel（推荐）
1. 连接 GitHub 仓库
2. 配置环境变量：`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`
3. 自动部署（推送到 `main` 分支触发）

### 自托管
```bash
# 1. 构建
npm run build

# 2. 启动
NODE_ENV=production npm run start

# 3. 进程管理（推荐 PM2）
pm2 start npm --name "co-work" -- start
```

### 数据库
- **开发**: 本地 PostgreSQL
- **生产**: Neon/Supabase/AWS RDS（需启用 SSL）
- **备份**: 定期导出 schema 和数据

## 技术债务

1. **类型安全**: 部分 API 响应未严格类型化
2. **错误处理**: 前端缺少统一错误边界
3. **代码重复**: 文件树操作逻辑可提取为 Hooks
4. **测试缺失**: 0% 覆盖率
5. **文档过时**: 部分注释未同步代码更新

## 性能指标（待测量）

- **首屏加载**: < 2s（目标）
- **文件树渲染**: 支持 1000+ 节点
- **编辑器响应**: < 16ms（60fps）
- **API 响应**: P95 < 300ms

## 学习资源

### 官方文档
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### 项目参考
- [shadcn/ui](https://ui.shadcn.com/): 组件设计灵感
- [Cal.com](https://github.com/calcom/cal.com): 协作应用架构
- [Notion Clone](https://github.com/konstantinmuenster/notion-clone): 编辑器实现

## 贡献指南

1. Fork 仓库并创建功能分支
2. 遵循 `AGENTS.md` 中的代码规范
3. 确保 `npm run lint` 和 `npm run typecheck` 通过
4. 提交 PR 并附上功能说明 + 截图
5. 等待 Code Review

## 许可证

未指定（建议添加 MIT/Apache 2.0）

## 项目状态

**当前阶段**: 原型开发（MVP）
**代码质量**: ⚠️ 存在技术债务，生产环境需加固
**维护状态**: 🟢 活跃开发中

---

**最后更新**: 2025-10-28
**文档版本**: v1.0
