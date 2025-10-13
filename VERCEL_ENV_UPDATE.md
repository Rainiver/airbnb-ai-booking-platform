# 🔧 Vercel 环境变量更新指南

## ⚠️ 当前问题
- 登录功能不工作
- 收藏功能不工作
- 原因：`NEXTAUTH_URL` 仍然指向 `localhost`

## ✅ 解决方案：更新 Vercel 环境变量

### 步骤1：进入 Vercel 项目设置
1. 访问：https://vercel.com/dashboard
2. 点击你的项目：`airbnb-ai-booking-platform`
3. 点击顶部的 **Settings** 标签
4. 在左侧菜单中点击 **Environment Variables**

### 步骤2：更新 NEXTAUTH_URL
找到 `NEXTAUTH_URL` 变量：

**旧值（错误）**：
```
http://localhost:3000
```

**新值（正确）**：
```
https://airbnb-ai-booking-platform.vercel.app
```

**操作步骤**：
1. 找到 `NEXTAUTH_URL` 这一行
2. 点击右侧的 **⋯** (三个点)
3. 选择 **Edit**
4. 将值改为：`https://airbnb-ai-booking-platform.vercel.app`
5. 确保选中所有环境：**Production**, **Preview**, **Development**
6. 点击 **Save**

### 步骤3：重新部署
更新环境变量后，需要重新部署：

**方法1：在 Settings 页面**
- 更新完环境变量后，Vercel 会提示 "Redeploy to apply changes"
- 点击 **Redeploy** 按钮

**方法2：在 Deployments 页面**
1. 点击顶部的 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **⋯** (三个点)
4. 选择 **Redeploy**
5. 点击 **Redeploy** 确认

### 步骤4：等待部署完成
- 部署需要 1-2 分钟
- 完成后会显示 ✅ Ready

### 步骤5：测试功能
重新访问：https://airbnb-ai-booking-platform.vercel.app

测试以下功能：
- ✅ 点击右上角头像
- ✅ 点击 "Sign up" 注册新账户
- ✅ 登录功能
- ✅ 收藏房源（点击心形图标）
- ✅ 搜索功能（Anywhere、Any Week 应该正常显示）

## 📋 完整的环境变量列表

确保 Vercel 中有以下环境变量：

```env
DATABASE_URL=mongodb+srv://airbnb-user:sdyzsdnxBH197157!@cluster0.c3uasvi.mongodb.net/airbnb-clone?retryWrites=true&w=majority&appName=Cluster0

NEXTAUTH_SECRET=/08jDnDsy07U51WLm+s45/UMuUVt7pkSHBbafo9TybU=

NEXTAUTH_URL=https://airbnb-ai-booking-platform.vercel.app

# 以下为可选（如果不用第三方登录，可以留空）
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_ID=
FACEBOOK_SECRET=
```

## 🎯 预期结果

更新后，应该能够：
1. ✅ 注册新用户
2. ✅ 登录/登出
3. ✅ 收藏房源
4. ✅ 搜索显示正确（Anywhere、Any Week、Add Guests）
5. ✅ 创建新房源
6. ✅ 预订房源

## ⚡ 快速检查清单

- [ ] 访问 Vercel Dashboard
- [ ] 进入项目 Settings → Environment Variables
- [ ] 更新 `NEXTAUTH_URL` 为 `https://airbnb-ai-booking-platform.vercel.app`
- [ ] 保存并重新部署
- [ ] 等待部署完成（1-2分钟）
- [ ] 测试登录功能
- [ ] 测试收藏功能
- [ ] 测试搜索显示

---

**完成后告诉我结果！** 🚀

