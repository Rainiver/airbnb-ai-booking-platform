// 测试 Vercel 部署的数据库连接
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    console.log('🔍 测试数据库连接...\n');
    
    // 测试1: 连接测试
    console.log('测试1: 尝试连接数据库...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');

    // 测试2: 查询房源数量
    console.log('测试2: 查询房源总数...');
    const count = await prisma.listing.count();
    console.log(`✅ 找到 ${count} 个房源\n`);

    // 测试3: 查询第一个房源
    console.log('测试3: 查询第一个房源详情...');
    const firstListing = await prisma.listing.findFirst({
      include: {
        user: true,
      },
    });
    
    if (firstListing) {
      console.log('✅ 房源详情:');
      console.log(`   ID: ${firstListing.id}`);
      console.log(`   标题: ${firstListing.title}`);
      console.log(`   价格: $${firstListing.price}`);
      console.log(`   位置: ${firstListing.locationValue}`);
      console.log(`   图片: ${firstListing.imageSrc}`);
      console.log(`   用户ID: ${firstListing.userId}`);
      console.log(`   用户存在: ${firstListing.user ? '是' : '否'}\n`);
    } else {
      console.log('❌ 没有找到房源\n');
    }

    // 测试4: 查询用户
    console.log('测试4: 查询用户表...');
    const userCount = await prisma.user.count();
    console.log(`✅ 找到 ${userCount} 个用户\n`);

    console.log('🎉 所有测试通过！\n');

  } catch (error) {
    console.error('❌ 错误:', error);
    console.error('\n详细错误信息:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

