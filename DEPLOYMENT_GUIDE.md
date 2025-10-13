## 部署与CI/CD指南

### 本地容器一键启动
```bash
docker compose up -d --build
```
- 首次会自动初始化Mongo副本集并执行`prisma db push`。

### GitHub Actions - CI
- 路径：`.github/workflows/ci.yml`
- 触发：对 `main` 分支的 push/PR
- 步骤：安装依赖 → prisma generate → lint → build

### GitHub Actions - CD（示例）
- 路径：`.github/workflows/cd.yml`
- 触发：对 `main` 的 push 或手动触发
- 需要在仓库 Secrets 设置：
  - `SSH_HOST`, `SSH_USER`, `SSH_KEY`
  - `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - 可选镜像仓库：`REGISTRY`、`REGISTRY_USER`、`REGISTRY_PASSWORD`

### 云服务器部署思路
1. 在服务器预装 Docker 与 docker-compose
2. 准备 `.env`（含 `DATABASE_URL` 等）
3. 运行镜像：
```bash
docker run -d --name airbnb-app --restart unless-stopped \
  --env-file .env -p 3000:3000 your-registry/your-repo:latest
```
4. 反向代理（可选）：用 Nginx/Traefik 配置域名与HTTPS

### 环境变量
- `DATABASE_URL`：MongoDB连接串（生产建议托管Atlas或自建副本集）
- `NEXTAUTH_SECRET`：NextAuth密钥
- `NEXTAUTH_URL`：外部可访问的站点URL
- 第三方登录所需的 `GOOGLE_CLIENT_ID/SECRET` 等按需添加

### 常见问题
- 首次启动报事务/副本集问题：确保Mongo以`--replSet rs0`运行，并已`rs.initiate()`。
- 构建失败：检查Node版本、锁文件一致性，CI中使用 `npm ci`。


