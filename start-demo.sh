#!/bin/bash

echo "🚀 启动Airbnb Clone演示项目..."

# 检查MongoDB是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "📦 启动MongoDB..."
    mongod --replSet rs0 --port 27017 --dbpath /opt/homebrew/var/mongodb &
    sleep 3
    mongosh --eval "rs.initiate()" > /dev/null 2>&1
    echo "✅ MongoDB已启动并配置为副本集"
fi

# 检查数据库是否有数据
echo "🔍 检查数据库数据..."
LISTING_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.listing.count().then(count => {
  console.log(count);
  prisma.\$disconnect();
}).catch(() => console.log('0'));
" 2>/dev/null || echo "0")

if [ "$LISTING_COUNT" -eq "0" ]; then
    echo "📊 数据库为空，添加演示数据..."
    node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDemoData() {
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      hashedPassword: '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.8.8'
    }
  });

  const listings = [
    { title: '现代海滨别墅', description: '位于海边的豪华别墅，拥有私人海滩和无敌海景。', imageSrc: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', category: 'Beach', roomCount: 4, bathroomCount: 3, guestCount: 8, locationValue: 'Malibu, California', price: 500, userId: user.id },
    { title: '山间木屋', description: '坐落在森林中的温馨木屋，周围环境宁静。', imageSrc: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', category: 'Countryside', roomCount: 2, bathroomCount: 1, guestCount: 4, locationValue: 'Aspen, Colorado', price: 200, userId: user.id },
    { title: '城市现代公寓', description: '位于市中心的现代化公寓，交通便利。', imageSrc: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', category: 'Modern', roomCount: 1, bathroomCount: 1, guestCount: 2, locationValue: 'New York, New York', price: 300, userId: user.id },
    { title: '湖景度假屋', description: '坐落在美丽湖泊旁的度假屋，拥有私人码头。', imageSrc: 'https://images.unsplash.com/photo-1506905925346-14b1e5dba1c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', category: 'Lake', roomCount: 3, bathroomCount: 2, guestCount: 6, locationValue: 'Lake Tahoe, California', price: 350, userId: user.id },
    { title: '豪华城堡', description: '历史悠久的城堡，拥有古典建筑风格和现代设施。', imageSrc: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', category: 'Castles', roomCount: 8, bathroomCount: 6, guestCount: 16, locationValue: 'Edinburgh, Scotland', price: 1200, userId: user.id }
  ];

  for (const listing of listings) {
    await prisma.listing.create({ data: listing });
  }
  
  console.log('✅ 演示数据添加完成');
  await prisma.\$disconnect();
}

addDemoData().catch(console.error);
"
    echo "✅ 演示数据已添加"
else
    echo "✅ 数据库已有数据 ($LISTING_COUNT 个房源)"
fi

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "📍 网站地址: http://localhost:3000"
echo "👤 演示账户: demo@example.com / password"
echo ""
echo "🎯 演示功能:"
echo "  - 浏览房源列表"
echo "  - 搜索和筛选"
echo "  - 用户注册/登录"
echo "  - 房源详情查看"
echo "  - 收藏和预订功能"
echo ""

npm run dev


