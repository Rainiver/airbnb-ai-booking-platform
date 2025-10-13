# 🚀 Vercel AI 功能配置指南

## 📋 配置清单

你需要在 Vercel 中添加以下新的环境变量：

### 1. Google Gemini API 配置

```bash
GEMINI_API_KEY=AIzaSyCHqPTClYV_pcJg4fBpUXsWhVjHD3fUG90
```

### 2. Supabase Vector Database 配置

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ntuoteplkhxgsaoafald.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dW90ZXBsa2h4Z3Nhb2FmYWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODAxNTgsImV4cCI6MjA3NTk1NjE1OH0.GhRXTSN6mdVRvks_vdmjhccDmDwlFjsYC7rXNOano8c
```

## 🔧 详细配置步骤

### 步骤 1: 登录 Vercel
1. 访问 https://vercel.com
2. 登录你的账号
3. 进入你的项目 `airbnb-ai-booking-platform`

### 步骤 2: 添加环境变量
1. 点击 **Settings** 标签
2. 点击左侧 **Environment Variables**
3. 添加以下三个变量：

#### 变量 1: GEMINI_API_KEY
- **Name**: `GEMINI_API_KEY`
- **Value**: `AIzaSyCHqPTClYV_pcJg4fBpUXsWhVjHD3fUG90`
- **Environment**: 选择 `Production`, `Preview`, `Development` (全选)
- 点击 **Save**

#### 变量 2: NEXT_PUBLIC_SUPABASE_URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://ntuoteplkhxgsaoafald.supabase.co`
- **Environment**: 选择 `Production`, `Preview`, `Development` (全选)
- 点击 **Save**

#### 变量 3: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dW90ZXBsa2h4Z3Nhb2FmYWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODAxNTgsImV4cCI6MjA3NTk1NjE1OH0.GhRXTSN6mdVRvks_vdmjhccDmDwlFjsYC7rXNOano8c`
- **Environment**: 选择 `Production`, `Preview`, `Development` (全选)
- 点击 **Save**

### 步骤 3: 重新部署
1. 返回 **Deployments** 标签
2. 点击最新部署右侧的 **⋯** (三个点)
3. 选择 **Redeploy**
4. 点击 **Redeploy** 确认

## 📊 配置完成后的环境变量列表

你的 Vercel 项目应该有以下所有环境变量：

```
✅ DATABASE_URL (已有)
✅ NEXTAUTH_SECRET (已有)
✅ NEXTAUTH_URL (已有)
✅ GEMINI_API_KEY (新增)
✅ NEXT_PUBLIC_SUPABASE_URL (新增)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY (新增)
```

## 🔍 验证配置

部署完成后：
1. 访问你的 Vercel 网站
2. 查看右下角是否有蓝色的 AI 助手按钮
3. 点击按钮，尝试与 AI 对话
4. 测试查询：
   - "我想找海边的房子"
   - "推荐一些便宜的房源"

## ⚠️ 注意事项

### 关于 API 密钥安全性
- ✅ **NEXT_PUBLIC_** 前缀的变量会暴露在客户端，但这是正常的
- ✅ Supabase 的 **anon key** 是专门设计为公开的
- ✅ 你的 Supabase 有 Row Level Security (RLS) 保护
- ⚠️ **GEMINI_API_KEY** 不应该有 `NEXT_PUBLIC_` 前缀，这样它只在服务器端使用

### API 费用
- ✅ Google Gemini 有免费额度
- ✅ Supabase 有免费层级
- 📊 预计每月费用：$0（免费额度内）

## 🎯 快速配置（复制粘贴）

如果你想快速配置，可以在 Vercel CLI 中运行：

```bash
# 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 登录
vercel login

# 添加环境变量
vercel env add GEMINI_API_KEY production
# 粘贴: AIzaSyCHqPTClYV_pcJg4fBpUXsWhVjHD3fUG90

vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 粘贴: https://ntuoteplkhxgsaoafald.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# 粘贴: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dW90ZXBsa2h4Z3Nhb2FmYWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODAxNTgsImV4cCI6MjA3NTk1NjE1OH0.GhRXTSN6mdVRvks_vdmjhccDmDwlFjsYC7rXNOano8c

# 重新部署
vercel --prod
```

## 🚨 常见问题

### Q: 环境变量添加后 AI 按钮还是不显示？
**A**: 确保已经重新部署，环境变量只在新部署时生效。

### Q: AI 助手无法响应？
**A**: 检查浏览器控制台是否有错误，可能是环境变量配置错误。

### Q: 如何检查环境变量是否正确？
**A**: 在 Vercel Dashboard → Settings → Environment Variables 中查看所有变量。

## ✅ 配置完成检查表

- [ ] 添加 `GEMINI_API_KEY`
- [ ] 添加 `NEXT_PUBLIC_SUPABASE_URL`
- [ ] 添加 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 三个变量都选择了所有环境（Production, Preview, Development）
- [ ] 触发了重新部署
- [ ] 部署成功完成
- [ ] 访问网站看到 AI 按钮
- [ ] AI 聊天功能正常工作

---

## 🎉 配置完成后

你的 Vercel 网站将拥有完整的 AI 功能：
- 🤖 智能旅行助手
- 🔍 语义搜索
- 💡 个性化推荐
- 📊 Multi-Agent 协作系统

**祝你配置顺利！** 🚀
