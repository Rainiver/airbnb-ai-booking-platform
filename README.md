# 🏠 Airbnb Clone - 全栈预订平台

一个功能完整的Airbnb克隆应用，使用现代技术栈构建，展示全栈开发技能。

## ✨ 项目特色

- 🎨 **现代化UI设计** - 使用Tailwind CSS构建响应式界面
- 🔐 **完整用户认证** - 支持邮箱注册/登录和第三方登录
- 🏠 **房源管理** - 用户可以发布、编辑、删除房源
- 🔍 **智能搜索** - 按地点、日期、价格、房型筛选
- ❤️ **收藏功能** - 用户可以收藏喜欢的房源
- 📅 **预订系统** - 完整的预订流程和日期管理
- 🗺️ **地图集成** - 房源位置展示和选择
- 📱 **移动端适配** - 完全响应式设计
- 🤖 **AI 智能助手** - RAG + Multi-Agent 系统，自然语言搜索房源（新）

## 🛠️ 技术栈

### 前端
- **Next.js 13** - React全栈框架，使用App Router
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **Framer Motion** - 动画库
- **React Hook Form** - 表单管理
- **React Leaflet** - 地图组件

### 后端
- **Next.js API Routes** - 服务端API
- **Prisma** - 现代数据库ORM
- **MongoDB** - NoSQL数据库
- **NextAuth.js** - 身份认证
- **bcrypt** - 密码加密

### 第三方服务
- **Cloudinary** - 图片存储和CDN
- **Google OAuth** - Google登录
- **Facebook OAuth** - Facebook登录

### AI 功能（新）
- **Google Gemini Pro** - LLM 对话和理解
- **Google Gemini Embeddings** - 768维向量生成
- **Supabase Vector Database** - 向量存储和检索
- **RAG Pipeline** - 检索增强生成
- **Multi-Agent System** - 搜索、推荐、预订智能体协作

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MongoDB
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <your-repo-url>
cd Airbnb-Build-master
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
创建 `.env.local` 文件并添加以下配置：
```env
# 数据库配置
DATABASE_URL="mongodb://localhost:27017/airbnb-clone"

# NextAuth 配置
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AI 功能配置（新）
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Google OAuth (可选)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Facebook OAuth (可选)
FACEBOOK_ID=""
FACEBOOK_SECRET=""

# Cloudinary 配置 (可选)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

4. **启动MongoDB**
```bash
# macOS (使用Homebrew)
brew services start mongodb-community

# 配置MongoDB为副本集
mongod --replSet rs0 --port 27017 --dbpath /opt/homebrew/var/mongodb
mongosh --eval "rs.initiate()"
```

5. **数据库迁移**
```bash
npx prisma generate
npx prisma db push
```

6. **生成 AI Embeddings（可选）**
```bash
# 为房源生成向量 embeddings
npm run generate-embeddings
```

7. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

## 📱 功能演示

### 主要功能
- ✅ 用户注册/登录系统
- ✅ 房源发布和管理
- ✅ 智能搜索和筛选
- ✅ 收藏和预订功能
- ✅ 响应式设计
- ✅ 地图集成
- ✅ 图片上传
- ✅ **AI 智能助手**（新功能）
  - 💬 自然语言搜索房源
  - 🤖 Multi-Agent 协作系统
  - 🔍 语义搜索和智能推荐
  - 📊 基于 RAG 技术

### 测试账户
- 邮箱: `test@example.com`
- 密码: `password`

## 🏗️ 项目结构

```
├── app/                    # Next.js 13 App Router
│   ├── actions/           # 服务端操作
│   ├── api/               # API路由
│   │   └── ai-chat/      # AI 聊天 API（新）
│   └── (pages)/           # 页面组件
├── components/            # React组件
│   ├── ai/               # AI 组件（新）
│   │   ├── AIChatButton.tsx
│   │   └── AIChatModal.tsx
│   ├── inputs/           # 表单组件
│   ├── listing/          # 房源相关组件
│   ├── models/           # 模态框组件
│   └── navbar/           # 导航组件
├── lib/                   # 工具库
│   ├── ai/               # AI 逻辑（新）
│   │   └── agents.ts     # Multi-Agent 系统
│   ├── gemini.ts         # Gemini AI 配置（新）
│   └── supabase.ts       # Vector Database（新）
├── prisma/               # 数据库模式
├── scripts/              # 脚本
│   └── generate-embeddings.ts  # 生成向量（新）
└── public/               # 静态资源
```

## 🔧 开发说明

### 数据库设计
- **User** - 用户信息
- **Listing** - 房源信息
- **Reservation** - 预订记录
- **Account** - 第三方账户关联

### 关键组件
- `ListingCard` - 房源卡片组件
- `SearchModal` - 搜索模态框
- `RentModal` - 发布房源模态框
- `Map` - 地图组件

## 📈 性能优化

- 使用Next.js 13的App Router
- 服务端渲染(SSR)
- 图片优化
- 代码分割
- 数据库查询优化

## 🚀 部署

### AWS 部署（推荐用于简历）⭐

本项目已配置完整的 AWS 部署方案，包括：
- ✅ **AWS EC2** 生产环境部署
- ✅ **MongoDB Atlas** 云数据库
- ✅ **Docker 容器化**部署
- ✅ **GitHub Actions CI/CD** 自动化部署
- ✅ **Nginx 反向代理** + SSL 证书

详细部署指南：📖 [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)

#### 快速部署（3步完成）

1. **创建 AWS EC2 实例**（t2.micro 免费层）
2. **SSH 连接并运行部署脚本**：
   ```bash
   git clone https://github.com/Rainiver/airbnb-ai-booking-platform.git
   cd airbnb-ai-booking-platform
   chmod +x scripts/deploy-to-aws.sh
   ./scripts/deploy-to-aws.sh
   ```
3. **访问应用**：`http://your-ec2-ip:3000`

#### 自动化部署

配置 GitHub Secrets 后，每次推送到 `main` 分支自动部署到 AWS：
- `SSH_HOST` - EC2 公网 IP
- `SSH_USER` - ubuntu
- `SSH_KEY` - .pem 密钥内容
- `DATABASE_URL` - MongoDB Atlas 连接串
- `NEXTAUTH_SECRET` - NextAuth 密钥
- `NEXTAUTH_URL` - 网站访问地址

### 其他部署平台

#### Vercel（免费，适合快速展示）
```bash
npm i -g vercel
vercel --prod
```

**⚠️ Vercel 环境变量配置**：
除了基础配置外，还需添加 AI 功能环境变量：
- `GEMINI_API_KEY` - Google Gemini API 密钥
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 公开密钥

详细配置步骤：📖 [VERCEL_AI_SETUP.md](./VERCEL_AI_SETUP.md)

**注意**：需配合 MongoDB Atlas 使用

#### Railway（$5/月免费额度）
- 支持 Docker + 数据库
- 连接 GitHub 自动部署

#### Render / Fly.io
- 免费层可用
- 详见 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🤖 AI 智能助手（新功能）

### 功能特性
- **自然语言搜索**：用户可以说"我想找个海边的房子，4个人，预算$200-300"
- **语义理解**：AI 理解"浪漫的地方"、"适合家庭"等模糊需求
- **个性化推荐**：基于用户偏好和历史行为推荐房源
- **多轮对话**：支持连续对话，记住上下文
- **房源卡片展示**：AI 推荐后直接显示可点击的房源卡片

### 技术架构
```
用户查询 → Gemini LLM 理解意图 → Multi-Agent 协作
    ↓
┌─────────────┬──────────────┬─────────────┐
│ SearchAgent │RecommendAgent│BookingAgent │
│ (语义搜索)  │  (排序推荐)  │(检查可用性) │
└─────────────┴──────────────┴─────────────┘
    ↓
查询 Vector DB + MongoDB → 返回结果 → LLM 生成回复
```

### 快速开始
详细设置步骤请查看：
- [AI_QUICK_START.md](./AI_QUICK_START.md) - 10分钟快速开始
- [AI_SETUP_GUIDE.md](./AI_SETUP_GUIDE.md) - 详细设置指南
- [AI_IMPLEMENTATION_SUMMARY.md](./AI_IMPLEMENTATION_SUMMARY.md) - 技术实现总结

### 成本
- ✅ **完全免费**
- Google Gemini Pro：60 requests/min
- Supabase Vector：500MB 存储
- Vercel：无限部署

---

## 📄 许可证

MIT License

## 👨‍💻 开发者

这个项目展示了以下技能：
- 全栈开发能力（Next.js + TypeScript + MongoDB）
- 现代React/Next.js技术
- 数据库设计和ORM使用
- 第三方API集成
- **LLM 应用开发**（RAG + Multi-Agent）（新）
- **AI 系统架构设计**（新）
- 响应式设计
- 用户体验优化

---

⭐ 如果这个项目对您有帮助，请给个星标！