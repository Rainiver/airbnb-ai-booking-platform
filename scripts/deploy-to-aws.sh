#!/bin/bash
# AWS EC2 快速部署脚本
# 在 EC2 实例上运行此脚本以快速部署应用

set -e

echo "🚀 开始部署 Airbnb 应用到 AWS EC2..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否在 EC2 上运行
if [ ! -f /sys/hypervisor/uuid ] && [ ! -d /sys/class/dmi/id ]; then
    echo -e "${YELLOW}警告: 似乎不在 EC2 实例上运行${NC}"
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安装，开始安装...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
    echo -e "${RED}请退出并重新登录以应用 Docker 组权限，然后重新运行此脚本${NC}"
    exit 0
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}未找到 .env 文件，创建模板...${NC}"
    cat > .env << 'EOF'
DATABASE_URL=mongodb+srv://username:password@cluster.xxx.mongodb.net/airbnb-clone
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://your-ec2-public-ip:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_ID=
FACEBOOK_SECRET=
EOF
    echo -e "${RED}请编辑 .env 文件填入正确的环境变量，然后重新运行此脚本${NC}"
    echo "vi .env"
    exit 1
fi

# 停止并删除旧容器
if [ "$(docker ps -aq -f name=airbnb-app)" ]; then
    echo "停止旧容器..."
    docker stop airbnb-app || true
    docker rm airbnb-app || true
fi

# 构建镜像
echo -e "${YELLOW}构建 Docker 镜像...${NC}"
docker build -t airbnb-app .

# 启动容器
echo -e "${YELLOW}启动应用容器...${NC}"
docker run -d --name airbnb-app --restart unless-stopped \
  --env-file .env -p 3000:3000 airbnb-app

# 等待容器启动
echo "等待应用启动..."
sleep 5

# 检查容器状态
if [ "$(docker ps -q -f name=airbnb-app)" ]; then
    echo -e "${GREEN}✓ 应用已成功启动！${NC}"
    
    # 获取公网 IP
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "unknown")
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}🎉 部署成功！${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "访问地址: http://${PUBLIC_IP}:3000"
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker logs -f airbnb-app"
    echo "  重启应用: docker restart airbnb-app"
    echo "  停止应用: docker stop airbnb-app"
    echo "  进入容器: docker exec -it airbnb-app sh"
    echo ""
    echo "初始化数据库:"
    echo "  docker exec -it airbnb-app npx prisma db push"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 显示日志
    echo ""
    echo "应用日志（Ctrl+C 退出）:"
    docker logs -f airbnb-app
else
    echo -e "${RED}✗ 应用启动失败，查看日志:${NC}"
    docker logs airbnb-app
    exit 1
fi

