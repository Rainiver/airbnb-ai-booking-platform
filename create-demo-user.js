const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const DEMO_USER_ID = '507f1f77bcf86cd799439011';

async function createDemoUser() {
  try {
    console.log('🔍 检查演示用户...\n');

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { id: DEMO_USER_ID }
    });

    if (existingUser) {
      console.log('✅ 演示用户已存在');
      console.log(`   姓名: ${existingUser.name}`);
      console.log(`   邮箱: ${existingUser.email}\n`);
      return;
    }

    console.log('📝 创建演示用户...\n');

    // 创建密码哈希
    const hashedPassword = await bcrypt.hash('demo123456', 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        name: 'Demo Host',
        email: 'demo@airbnb.com',
        hashedPassword: hashedPassword,
        image: '/assets/avatar.png',
        emailVerified: new Date(),
        favoriteIds: [],
      }
    });

    console.log('✅ 演示用户创建成功！');
    console.log(`   ID: ${user.id}`);
    console.log(`   姓名: ${user.name}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   密码: demo123456\n`);

    // 验证房源关联
    const listingCount = await prisma.listing.count({
      where: { userId: DEMO_USER_ID }
    });

    console.log(`✅ ${listingCount} 个房源现在关联到这个用户\n`);
    console.log('🎉 完成！现在所有房源都有对应的用户了！\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();

