# 🎉 AWS 部署成功指南

## ✅ 部署完成检查清单

完成以下所有步骤后，你的应用就成功部署到 AWS 了！

### 1. AWS EC2 配置 ✓

- [x] EC2 实例已创建（t2.micro 或 t3.micro）
- [x] 实例状态：**Running**
- [ ] Status check：**2/2 checks passed**（当前：2/3，需要修复）
- [x] Key pair：pair1.pem 已下载
- [x] Security Group 配置：
  - [x] SSH (22) - 0.0.0.0/0
  - [x] HTTP (80) - 0.0.0.0/0  
  - [x] HTTPS (443) - 0.0.0.0/0
  - [x] Custom TCP (3000) - 0.0.0.0/0

### 2. MongoDB Atlas 配置 ✓

- [x] 免费集群已创建（M0 Sandbox）
- [x] 数据库用户已创建
- [x] 网络访问：允许所有 IP (0.0.0.0/0)
- [x] 连接字符串已获取

### 3. GitHub 配置 ✓

- [x] 仓库已改为公开（Public）
- [x] GitHub Secrets 已配置（6个）：
  - [x] SSH_HOST: 16.170.243.9
  - [x] SSH_USER: ubuntu
  - [x] SSH_KEY: pair1.pem 内容
  - [x] DATABASE_URL: MongoDB Atlas 连接串
  - [x] NEXTAUTH_SECRET: 已生成
  - [x] NEXTAUTH_URL: http://16.170.243.9:3000

### 4. CI/CD 工作流 ✓

- [x] CI 工作流：构建和测试
- [x] CD 工作流：自动部署到 AWS
- [x] 测试工作流：验证 Secrets 配置

---

## 🚀 部署步骤（待完成）

### 当前进度：

✅ 1. EC2 实例创建完成  
✅ 2. MongoDB Atlas 配置完成  
✅ 3. GitHub Secrets 配置完成  
✅ 4. SSH 连接测试通过  
⏳ 5. 等待 Status check 通过（修复中）  
⏳ 6. 运行 CD 工作流部署应用  
⏳ 7. 初始化数据库  
⏳ 8. 导入房源数据  

---

## 🔧 当前问题与解决方案

### 问题：Instance reachability check failed

**解决方法**：
1. Stop instance
2. 等待完全停止
3. Start instance
4. 等待 Status check 变为 2/2

**预计时间**：5-10 分钟

---

## 📋 部署后的操作

### 1. 访问应用

浏览器打开：**http://16.170.243.9:3000**

### 2. 初始化数据库

在本地 Mac 运行：

```bash
# 推送数据库结构
DATABASE_URL="mongodb+srv://airbnb-user:sdyzsdnxBH197157!@cluster0.c3uasvi.mongodb.net/airbnb-clone?retryWrites=true&w=majority&appName=Cluster0" npx prisma db push

# 创建演示用户
DATABASE_URL="mongodb+srv://airbnb-user:sdyzsdnxBH197157!@cluster0.c3uasvi.mongodb.net/airbnb-clone?retryWrites=true&w=majority&appName=Cluster0" node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
(async () => {
  const hashedPassword = await bcrypt.hash('password', 12);
  await prisma.user.upsert({
    where: { email: 'demo@airbnb-demo.com' },
    update: {},
    create: {
      email: 'demo@airbnb-demo.com',
      name: 'Demo User',
      hashedPassword: hashedPassword,
    },
  });
  console.log('✅ 演示用户创建成功: demo@airbnb-demo.com / password');
  await prisma.\$disconnect();
})();
"

# 导入房源数据（使用本地图片）
DATABASE_URL="mongodb+srv://airbnb-user:sdyzsdnxBH197157!@cluster0.c3uasvi.mongodb.net/airbnb-clone?retryWrites=true&w=majority&appName=Cluster0" npx ts-node scripts/assign-shuffled-local-images.ts

# 分配随机国家
DATABASE_URL="mongodb+srv://airbnb-user:sdyzsdnxBH197157!@cluster0.c3uasvi.mongodb.net/airbnb-clone?retryWrites=true&w=majority&appName=Cluster0" npx ts-node scripts/assign-random-countries.ts
```

### 3. 验证部署

- ✅ 访问首页看到房源列表
- ✅ 可以注册/登录
- ✅ 可以浏览房源详情
- ✅ 可以进行预订

---

## 🎯 下一步

1. **等待 Status check 恢复**（Stop → Start 实例）
2. **测试 SSH 连接**
3. **运行 GitHub Actions CD 部署**
4. **访问应用并初始化数据**

---

## 💼 简历内容（部署完成后）

```
Airbnb 全栈预订平台
技术栈：Next.js 13, TypeScript, Tailwind CSS, Prisma, MongoDB
部署运维：
• AWS EC2 (t3.micro) Ubuntu 生产环境部署
• Docker 容器化，多阶段构建优化镜像大小
• GitHub Actions CI/CD 自动化部署流水线
• MongoDB Atlas 云数据库管理与副本集配置
• Linux 服务器运维，SSH 密钥与 Security Groups 配置
• 在线 Demo: http://16.170.243.9:3000
```

---

现在先执行 **Stop → Start** 操作，等 Status check 变为 2/2 后告诉我！

