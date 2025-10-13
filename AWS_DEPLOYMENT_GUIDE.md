# AWS 部署完整指南

## 📋 前置准备

### 1. 注册 AWS 账户（免费）
1. 访问 https://aws.amazon.com/free/
2. 点击"创建免费账户"
3. 需要信用卡验证（不会扣费，仅验证身份）
4. **AWS Free Tier** 包含：
   - EC2 t2.micro/t3.micro: 750小时/月（12个月）
   - 存储：30GB EBS
   - 数据传输：15GB/月

### 2. 注册 MongoDB Atlas（免费数据库）
1. 访问 https://www.mongodb.com/cloud/atlas/register
2. 选择 **Free Shared Cluster**（512MB，永久免费）
3. 创建数据库集群（推荐选择 AWS 同区域，如 us-east-1）
4. 配置网络访问：允许所有IP（0.0.0.0/0）或仅 EC2 IP
5. 获取连接字符串：`mongodb+srv://username:password@cluster.xxx.mongodb.net/airbnb-clone`

## 🚀 部署步骤

### 第一步：创建 EC2 实例

1. **登录 AWS Console** → 选择 **EC2**
2. **Launch Instance**（启动实例）
3. 配置如下：
   - **Name**: `airbnb-booking-app`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type**: t2.micro（免费层）
   - **Key pair**: 创建新密钥对（下载 .pem 文件，妥善保存）
   - **Network settings**: 
     - ✅ Allow SSH (22) from My IP
     - ✅ Allow HTTP (80) from Anywhere
     - ✅ Allow HTTPS (443) from Anywhere
     - ✅ Allow Custom TCP (3000) from Anywhere
   - **Storage**: 8GB gp3（免费层最多30GB）
4. **Launch instance**

### 第二步：连接到 EC2

```bash
# macOS/Linux
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip

# Windows（使用 PowerShell 或 Git Bash）
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

### 第三步：在 EC2 上安装环境

连接后，在 EC2 实例上执行：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
# 退出重新登录以应用 docker 组权限
exit
# 重新 SSH 连接

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

# 安装 Git
sudo apt install git -y
```

### 第四步：部署应用

```bash
# 克隆仓库
git clone https://github.com/Rainiver/airbnb-ai-booking-platform.git
cd airbnb-ai-booking-platform

# 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL=mongodb+srv://username:password@cluster.xxx.mongodb.net/airbnb-clone
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://your-ec2-public-ip:3000
GOOGLE_CLIENT_ID=your-google-client-id-optional
GOOGLE_CLIENT_SECRET=your-google-client-secret-optional
FACEBOOK_ID=your-facebook-id-optional
FACEBOOK_SECRET=your-facebook-secret-optional
EOF

# 构建并启动
docker build -t airbnb-app .
docker run -d --name airbnb-app --restart unless-stopped \
  --env-file .env -p 3000:3000 airbnb-app

# 查看日志
docker logs -f airbnb-app
```

### 第五步：配置域名（可选但推荐）

#### 方案A：使用 Nginx 反向代理 + SSL

```bash
# 安装 Nginx
sudo apt install nginx -y

# 配置 Nginx
sudo tee /etc/nginx/sites-available/airbnb << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/airbnb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 安装免费 SSL 证书（Let's Encrypt）
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

#### 方案B：直接使用 EC2 公网 IP
- 访问 `http://your-ec2-public-ip:3000`
- 在 `.env` 中设置 `NEXTAUTH_URL=http://your-ec2-public-ip:3000`

### 第六步：数据库初始化

```bash
# 进入容器
docker exec -it airbnb-app sh

# 推送 Prisma schema
npx prisma db push

# 可选：导入演示数据
# 退出容器后，将本地 scripts/ 复制到服务器
exit

# 在 EC2 上运行 seed 脚本
docker exec -it airbnb-app npx ts-node scripts/assign-random-countries.ts
```

## 🔄 自动化部署（GitHub Actions → AWS）

### 配置 GitHub Secrets

在你的 GitHub 仓库：**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

添加以下 Secrets：

| Secret Name | Value | 说明 |
|------------|-------|------|
| `SSH_HOST` | EC2 公网 IP | 如 `3.85.123.45` |
| `SSH_USER` | `ubuntu` | EC2 默认用户 |
| `SSH_KEY` | .pem 文件内容 | 完整复制 your-key.pem 的内容 |
| `DATABASE_URL` | MongoDB 连接串 | Atlas 连接字符串 |
| `NEXTAUTH_SECRET` | 随机字符串 | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 网站地址 | `http://your-ip:3000` 或域名 |

### 自动部署工作流已配置

每次推送到 `main` 分支，GitHub Actions 会：
1. ✅ 运行测试和构建（CI）
2. ✅ 构建 Docker 镜像（CD）
3. ✅ SSH 到 EC2，拉取最新代码并重启容器

## 📊 成本估算（AWS Free Tier）

| 服务 | 免费额度 | 超出费用 |
|-----|---------|---------|
| EC2 t2.micro | 750小时/月 × 12个月 | ~$0.0116/小时 |
| EBS 存储 | 30GB × 12个月 | $0.10/GB/月 |
| 数据传输 | 15GB/月出站 | $0.09/GB |
| MongoDB Atlas | 512MB 永久免费 | $0（升级收费）|

**预计月成本**：**$0**（12个月内）→ 12个月后约 **$8-10/月**

## 🛠️ 常用运维命令

```bash
# SSH 连接
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# 查看容器状态
docker ps

# 查看日志
docker logs -f airbnb-app

# 重启容器
docker restart airbnb-app

# 更新代码并重新部署
cd airbnb-ai-booking-platform
git pull origin main
docker build -t airbnb-app .
docker stop airbnb-app
docker rm airbnb-app
docker run -d --name airbnb-app --restart unless-stopped \
  --env-file .env -p 3000:3000 airbnb-app

# 清理旧镜像
docker image prune -a -f
```

## 🎯 简历技能点

完成 AWS 部署后，你可以在简历中写：

```
技术栈与部署：
✅ 云平台：AWS EC2 部署生产环境，熟悉 Ubuntu Server 运维
✅ 容器化：Docker 容器化应用，优化镜像大小与构建速度
✅ CI/CD：GitHub Actions 自动化测试、构建、部署流水线
✅ 数据库：MongoDB Atlas 云数据库配置与管理
✅ 反向代理：Nginx 配置、SSL 证书（Let's Encrypt）
✅ 网络安全：AWS Security Groups 配置、SSH 密钥管理
✅ 监控运维：Docker logs 日志查看、容器健康检查
```

## 🚨 故障排查

### 无法访问网站
1. 检查 EC2 Security Group 是否开放 3000/80/443 端口
2. 检查容器是否运行：`docker ps`
3. 检查日志：`docker logs airbnb-app`
4. 检查 NEXTAUTH_URL 是否正确

### 数据库连接失败
1. 检查 MongoDB Atlas 网络访问白名单
2. 检查 DATABASE_URL 连接串是否正确
3. 测试连接：`docker exec airbnb-app npx prisma db push`

### SSH 连接失败
1. 检查 .pem 文件权限：`chmod 400 your-key.pem`
2. 检查 Security Group 是否允许你的 IP SSH（22端口）
3. 确认使用正确的用户名（ubuntu）

## 📚 进阶优化

### 1. 配置自定义域名
- 在域名注册商添加 A 记录指向 EC2 IP
- 使用 Route 53（AWS DNS）管理域名

### 2. 使用 Elastic IP
- EC2 停止后 IP 会变，Elastic IP 可固定 IP
- AWS Console → EC2 → Elastic IPs → Allocate

### 3. 配置自动备份
```bash
# 定时备份脚本
crontab -e
# 每天凌晨2点备份
0 2 * * * docker exec airbnb-app npx prisma db pull && tar -czf ~/backup-$(date +\%Y\%m\%d).tar.gz ~/airbnb-ai-booking-platform
```

### 4. 配置 CloudWatch 监控
- AWS Console → CloudWatch → 创建 Dashboard
- 监控 CPU、内存、网络使用率

---

## ✅ 部署检查清单

- [ ] AWS 账户已注册并验证
- [ ] MongoDB Atlas 免费集群已创建
- [ ] EC2 实例已启动（t2.micro）
- [ ] Security Groups 已配置（22/80/443/3000）
- [ ] SSH 密钥已下载并妥善保存
- [ ] Docker 和 Docker Compose 已安装
- [ ] 应用已构建并运行
- [ ] .env 环境变量已正确配置
- [ ] 可通过浏览器访问应用
- [ ] GitHub Secrets 已配置（自动部署）
- [ ] 数据库已初始化（prisma db push）
- [ ] 可选：域名已配置
- [ ] 可选：SSL 证书已安装

完成以上步骤后，你的 Airbnb 项目就成功部署到 AWS 了！🎉

