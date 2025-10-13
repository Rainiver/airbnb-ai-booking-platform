# 🎯 正确的使用方式

## 问题分析

您看到的"EmptyState"是正常的，因为这个项目是设计为**用户自己注册并上传房源**的，而不是预填充数据。

## 正确的使用流程

### 1. 用户注册
- 点击右上角的"Avatar"按钮
- 选择"Register"
- 填写用户信息（姓名、邮箱、密码）
- 点击"Continue"

### 2. 用户登录
- 注册成功后，点击"Log in"
- 使用刚才注册的账户登录

### 3. 上传房源
- 登录后，点击"Airbnb your Home"
- 按照步骤填写房源信息：
  - 选择房源类型（Lux、Modern、Castles等）
  - 选择位置
  - 填写房间信息（卧室、浴室、客人数量）
  - 上传图片
  - 填写描述
  - 设置价格

### 4. 查看房源
- 上传的房源会显示在首页
- 可以搜索、筛选、收藏房源

## 技术实现

这个项目使用了：
- **NextAuth.js** - 用户认证
- **Prisma + MongoDB** - 数据存储
- **Cloudinary** - 图片存储（可选）
- **Google/Facebook OAuth** - 第三方登录（可选）

## 环境变量配置

如果需要完整功能，需要配置：

```env
# 数据库配置
DATABASE_URL="mongodb://localhost:27017/airbnb-clone"

# NextAuth 配置
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

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

## 演示建议

1. **注册一个测试账户**
2. **上传几个房源**（使用不同的图片和描述）
3. **展示完整功能**（搜索、筛选、收藏、预订）

这样就能展示一个完整的Airbnb克隆应用了！

## 总结

这个项目不是设计为有预填充数据的，而是让用户自己创建内容。这是现代Web应用的标准做法，用户生成内容(UGC)。


