# 🏠 AI智能旅行预订平台

[![CI](https://github.com/Rainiver/airbnb-ai-booking-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Rainiver/airbnb-ai-booking-platform/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/部署于-Vercel-black?logo=vercel)](https://airbnb-build-master.vercel.app)

基于 **RAG + Multi-Agent AI** 的全栈智能旅行预订系统，支持自然语言搜索、价格预测和智能预订辅助。

---

## 📷 Demo演示

### 房源浏览、搜索与收藏
<div align="center">
  <img src="./demo/houses.gif" alt="房源功能展示" width="90%" />
</div>

**核心功能:**
- 🏠 **房源浏览** - 响应式网格布局展示
- 🔍 **智能搜索** - 位置、日期、人数多条件筛选  
- ❤️ **收藏功能** - 一键收藏喜爱的房源
- 📋 **房源详情** - 完整信息展示与即时预订

### 🤖 AI智能助手 (Multi-Agent系统)
<div align="center">
  <img src="./demo/agent.gif" alt="AI Agent智能助手" width="90%" />
</div>

**AI核心能力:**
- 🔍 **语义搜索** - 自然语言理解，768维向量检索
- 📅 **日期解析** - NLP时间识别与可用性检测  
- 💰 **价格预测** - 5因子动态定价模型
- 🎯 **智能预订** - AI辅助完整预订流程
- 🧠 **上下文记忆** - 多轮对话，智能推理
- 👥 **Multi-Agent协作** - 搜索Agent + 推荐Agent + 预订Agent
- 🎨 **3D动画界面** - Apple风格Siri动画效果

---

## ✨ 核心特性

- 🎨 **现代化UI设计** - Glassmorphism玻璃态风格，3D动画效果
- 🤖 **RAG检索增强** - 768维向量语义搜索，Supabase pgvector
- 👥 **Multi-Agent系统** - 搜索/推荐/预订三大智能体协作
- 💰 **动态定价引擎** - 5因子模型：季节/周末/提前/最后/节假日
- 🧠 **对话记忆系统** - 上下文感知，多轮智能推理
- 🎯 **意图识别** - Google Gemini Pro自然语言处理

---

## 🛠️ 技术栈

**前端**: Next.js 13 (App Router) · TypeScript · Tailwind CSS · Canvas 2D API

**后端**: Next.js API Routes · Prisma ORM · MongoDB Atlas · NextAuth.js

**AI/ML**: Google Gemini Pro (NLP) · Gemini Embeddings (768-dim) · Supabase Vector (pgvector) · RAG Pipeline

**部署**: Vercel (前端+API) · MongoDB Atlas (数据库) · Supabase (向量数据库)

---

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/Rainiver/airbnb-ai-booking-platform.git
cd airbnb-ai-booking-platform

# 2. 安装依赖
npm install

# 3. 配置环境变量 (.env.local)
DATABASE_URL="mongodb+srv://..."           # MongoDB数据库连接
NEXTAUTH_SECRET="your-secret"              # 认证密钥
NEXTAUTH_URL="http://localhost:3000"       # 应用URL
GEMINI_API_KEY="your-gemini-key"           # Google Gemini API密钥
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"           # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"      # Supabase匿名密钥

# 4. 初始化数据库
npx prisma generate
npx prisma db push

# 5. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

---

## 🏗️ 系统架构

```
用户查询 → 意图解析(Gemini Pro) → Agent编排
              ↓
  ┌─────────┬─────────┬─────────┐
  │ 搜索Agent │ 推荐Agent │ 预订Agent │
  └─────────┴─────────┴─────────┘
              ↓
  向量检索 + MongoDB → LLM生成响应
```

**工作流程**: 意图识别 → 向量语义搜索(768-dim) → 多因子排序 → 可用性检查 → 价格预测 → 上下文响应生成

---

## 📊 性能指标

- ⚡ **响应时间**: 1-3秒 (缓存<1秒)
- 🎯 **准确率**: 语义搜索>90%，上下文理解>95%
- 📦 **数据规模**: 75房源 × 768维向量嵌入
- 🎨 **动画**: 60fps Canvas渲染
- 💰 **成本**: $0/月 (免费层部署)

---

## 🚀 部署

```bash
# Vercel一键部署
npm i -g vercel
vercel --prod
```

**必需环境变量**: `DATABASE_URL` · `NEXTAUTH_SECRET` · `NEXTAUTH_URL` · `GEMINI_API_KEY` · `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY`

详细配置见 [AI Setup Guide](./docs/AI_SETUP.md)

---

## 🎯 项目亮点

- ✨ **真正的AI集成** - 非简单聊天机器人，而是Multi-Agent智能体协作系统
- 🧠 **上下文感知** - 对话记忆，无需重复信息
- 💡 **价格智能** - 预测最佳预订时间，帮助用户省钱
- 🎨 **精美UI** - Apple级别设计，流畅动画
- 🚀 **生产就绪** - 已部署上线，完整可用

---

## 📖 相关文档

- [AI功能配置指南](./docs/AI_SETUP.md) - AI功能完整配置说明
- [CI/CD部署指南](./docs/CICD_SETUP.md) - GitHub Actions & Vercel自动部署

---

## 🔗 链接

- **在线演示**: [airbnb-build-master.vercel.app](https://airbnb-build-master.vercel.app)  
- **GitHub仓库**: [github.com/Rainiver/airbnb-ai-booking-platform](https://github.com/Rainiver/airbnb-ai-booking-platform)
- **开源协议**: MIT License

---

## 👨‍💻 作者

如有问题或建议，欢迎提交 Issue 或 Pull Request！
