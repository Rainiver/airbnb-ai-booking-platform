# 🤖 AI 智能助手设置指南

## 📋 需要的环境变量

在 `.env.local` 文件中添加以下变量：

```env
# Google Gemini API（免费）
GEMINI_API_KEY=你的API密钥

# Supabase（免费）
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

---

## 🔑 第1步：获取 Google Gemini API Key（免费）

1. **访问**：https://makersuite.google.com/app/apikey
2. **登录** Google 账户
3. **点击** "Create API Key"
4. **选择** 现有项目或创建新项目
5. **复制** API Key

**免费额度**：
- ✅ 60 requests/分钟
- ✅ 1500 requests/天
- ✅ 完全免费，无需信用卡

---

## 🗄️ 第2步：设置 Supabase Vector Database（免费）

### 2.1 创建 Supabase 项目

1. **访问**：https://supabase.com/dashboard
2. **登录/注册** 账户（可以用 GitHub 登录）
3. **点击** "New Project"
4. **填写**：
   - Project Name: `airbnb-ai`
   - Database Password: 设置密码（记住它）
   - Region: 选择离你最近的
5. **等待** 2-3 分钟项目创建完成

### 2.2 获取 API Keys

1. 在项目页面，点击左侧的 **Settings** (齿轮图标)
2. 点击 **API**
3. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2.3 启用 Vector Extension

1. 在项目页面，点击左侧的 **SQL Editor**
2. 点击 **New Query**
3. 复制粘贴以下 SQL：

```sql
-- 启用 vector extension
create extension if not exists vector;

-- 创建 embeddings 表
create table if not exists listing_embeddings (
  id bigserial primary key,
  listing_id text not null unique,
  embedding vector(768),  -- Gemini embeddings 是 768 维
  content text not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 创建索引（加速查询）
create index on listing_embeddings using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 创建相似度搜索函数
create or replace function match_listings (
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  listing_id text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    listing_id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from listing_embeddings
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

4. **点击** "Run" 执行 SQL

---

## 🚀 第3步：更新 Vercel 环境变量

部署到 Vercel 时，需要添加以下环境变量：

1. 访问：https://vercel.com/dashboard
2. 进入你的项目 `airbnb-ai-booking-platform`
3. 点击 **Settings** → **Environment Variables**
4. 添加以下变量：

| Key | Value | Environments |
|-----|-------|--------------|
| `GEMINI_API_KEY` | 你的 Gemini API Key | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key | Production, Preview, Development |

5. **保存** 并 **Redeploy**

---

## ✅ 第4步：初始化 Embeddings

本地运行以下命令生成房源的 vector embeddings：

```bash
npm run generate-embeddings
```

这会：
1. ✅ 读取数据库中的 75 个房源
2. ✅ 使用 Gemini API 生成 embeddings
3. ✅ 存储到 Supabase Vector Database
4. ✅ 预计 2-3 分钟完成

---

## 🧪 第5步：测试

1. **启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **打开浏览器**：http://localhost:3000

3. **点击** 右下角的 AI 助手按钮（紫色悬浮按钮）

4. **测试对话**：
   - "我想找一个海边的房子"
   - "推荐一个适合4个人的现代公寓"
   - "有没有便宜的房源，预算 $100-200"

---

## 💰 成本总结

| 服务 | 成本 | 免费额度 |
|------|------|---------|
| **Google Gemini** | 免费 | 60 req/min, 1500 req/day |
| **Supabase** | 免费 | 500MB 存储, 2GB 传输 |
| **Vercel** | 免费 | 无限部署 |
| **总计** | **$0** | ✅ 完全免费 |

---

## 🎯 功能清单

完成设置后，你的 AI 助手将支持：

- ✅ 语义搜索（理解自然语言）
- ✅ RAG 检索增强生成
- ✅ Multi-Agent 协作
- ✅ 多轮对话记忆
- ✅ Function Calling 实时查询
- ✅ 个性化推荐
- ✅ 流式响应

---

## 🆘 常见问题

### Q: Gemini API 报错 "API key not valid"
**A**: 检查 API Key 是否正确复制，确保没有多余空格

### Q: Supabase 连接失败
**A**: 检查 URL 和 Key 是否正确，确保项目状态是 "Active"

### Q: Embeddings 生成失败
**A**: 检查 Gemini API 额度，确保 Supabase 表已创建

---

## 📚 下一步

设置完成后，查看 `AI_ARCHITECTURE.md` 了解系统架构和技术细节！

