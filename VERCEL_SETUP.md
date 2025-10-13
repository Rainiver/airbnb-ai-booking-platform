# Vercel 部署指南

## 🚀 快速部署到 Vercel（5分钟）

### 方法一：通过 Vercel 网站部署（推荐）

1. **访问 Vercel**
   - https://vercel.com/signup

2. **使用 GitHub 登录**
   - 点击 "Continue with GitHub"
   - 授权 Vercel 访问你的 GitHub

3. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择 `airbnb-ai-booking-platform` 仓库
   - 点击 "Import"

4. **配置环境变量**
   
   在 "Environment Variables" 部分添加：
   
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `mongodb+srv://airbnb-user:sdyzsdnxBH197157!@cluster0.c3uasvi.mongodb.net/airbnb-clone?retryWrites=true&w=majority&appName=Cluster0` |
   | `NEXTAUTH_SECRET` | `/08jDnDsy07U51WLm+s45/UMuUVt7pkSHBbafo9TybU=` |
   | `NEXTAUTH_URL` | 留空（Vercel 会自动设置） |

5. **点击 Deploy**
   - 等待 2-3 分钟
   - 完成！

6. **获取部署地址**
   - 部署完成后会显示：`https://airbnb-ai-booking-platform.vercel.app`
   - 或类似的地址

---

### 方法二：通过命令行部署

如果你想用命令行（需要修复 npm 权限）：

```bash
# 修复 npm 权限
sudo chown -R $(whoami) ~/.npm

# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

---

## 🔧 部署后配置

### 1. 设置自定义域名（可选）

在 Vercel Dashboard：
- Project Settings → Domains
- 添加你的域名

### 2. 配置环境变量

如果需要修改环境变量：
- Project Settings → Environment Variables
- 添加或修改变量
- 重新部署

### 3. 初始化数据库

部署成功后，在本地运行：

```bash
# 推送数据库结构
DATABASE_URL="mongodb+srv://airbnb-user:sdyzsdnxBH197157!@cluster0.c3uasvi.mongodb.net/airbnb-clone?retryWrites=true&w=majority&appName=Cluster0" npx prisma db push

# 导入数据（使用 manage-data.js）
DATABASE_URL="mongodb+srv://airbnb-user:sdyzsdnxBH197157!@cluster0.c3uasvi.mongodb.net/airbnb-clone?retryWrites=true&w=majority&appName=Cluster0" node manage-data.js seed-demo
```

---

## ✅ Vercel 的优势

- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN（访问速度快）
- ✅ 自动 CI/CD（git push 自动部署）
- ✅ 零配置
- ✅ 无需维护服务器

---

## 🌐 部署完成后

你会得到一个地址，类似：
- `https://airbnb-ai-booking-platform.vercel.app`
- 或 `https://airbnb-ai-booking-platform-rainiver.vercel.app`

这就是你的在线 Demo 地址！

