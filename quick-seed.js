const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 生成一个固定的有效 ObjectID
const DEMO_USER_ID = '507f1f77bcf86cd799439011';

// 20个热门国家
const countries = ['US', 'GB', 'FR', 'DE', 'IT', 'ES', 'CA', 'AU', 'JP', 'KR', 'CN', 'SG', 'AE', 'TH', 'VN', 'BR', 'MX', 'TR', 'NL', 'SE'];

// 房源类型
const categories = ['Beach', 'Windmills', 'Modern', 'Countryside', 'Pools', 'Islands', 'Lake', 'Skiing', 'Castles', 'Caves', 'Camping', 'Arctic', 'Desert', 'Barns', 'Lux'];

// 房源标题模板
const titles = [
  'Luxury Villa', 'Cozy Apartment', 'Modern Loft', 'Beach House', 'Mountain Cabin',
  'City Studio', 'Countryside Cottage', 'Penthouse Suite', 'Garden House', 'Lake View Home',
  'Seaside Retreat', 'Urban Oasis', 'Historic Mansion', 'Desert Lodge', 'Forest Cabin'
];

async function quickSeed() {
  try {
    console.log('🚀 开始快速导入数据...\n');

    // 1. 清空现有数据
    console.log('🧹 清空旧数据...');
    await prisma.listing.deleteMany({});
    console.log('✅ 旧数据已清空\n');

    // 2. 创建50个房源
    console.log('📦 创建50个房源...');
    const listings = [];
    
    for (let i = 1; i <= 50; i++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const title = `${titles[Math.floor(Math.random() * titles.length)]} ${i}`;
      const price = Math.floor(Math.random() * 400) + 50; // $50-$450
      const rooms = Math.floor(Math.random() * 4) + 1; // 1-5
      const bathrooms = Math.floor(Math.random() * 3) + 1; // 1-4
      const guests = Math.floor(Math.random() * 6) + 1; // 1-7
      
      listings.push({
        title,
        description: `Beautiful ${category.toLowerCase()} property with amazing views and modern amenities. Perfect for your next vacation!`,
        imageSrc: `https://picsum.photos/seed/${category}-${i}/1200/800`,
        category,
        roomCount: rooms,
        bathroomCount: bathrooms,
        guestCount: guests,
        locationValue: country,
        userId: DEMO_USER_ID,
        price
      });

      // 每10个显示进度
      if (i % 10 === 0) {
        console.log(`   创建了 ${i}/50 个房源...`);
      }
    }

    // 批量插入
    await prisma.listing.createMany({
      data: listings
    });

    console.log('✅ 50个房源创建完成！\n');

    // 3. 显示统计
    const total = await prisma.listing.count();
    console.log('📊 数据统计:');
    console.log(`   总房源数: ${total}`);
    console.log(`   平均价格: $${Math.floor(listings.reduce((sum, l) => sum + l.price, 0) / listings.length)}`);
    console.log(`   涵盖国家: ${countries.length}个`);
    console.log(`   房源类型: ${categories.length}种\n`);

    console.log('✅ 数据导入完成！');
    console.log('🌐 现在刷新你的网站查看效果！\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickSeed();

