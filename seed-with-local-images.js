const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
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
  'Seaside Retreat', 'Urban Oasis', 'Historic Mansion', 'Desert Lodge', 'Forest Cabin',
  'Elegant Townhouse', 'Charming Bungalow', 'Stylish Condo', 'Rustic Farmhouse', 'Waterfront Property'
];

async function seedWithLocalImages() {
  try {
    console.log('🚀 开始使用本地图片导入数据...\n');

    // 1. 读取本地图片
    const picDir = path.join(process.cwd(), 'public', 'pic');
    const allFiles = fs.readdirSync(picDir);
    const imageFiles = allFiles.filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg') || 
      file.toLowerCase().endsWith('.png') ||
      file.toLowerCase().endsWith('.webp')
    );
    
    console.log(`📸 找到 ${imageFiles.length} 张本地图片\n`);

    if (imageFiles.length === 0) {
      console.error('❌ 没有找到图片文件！');
      return;
    }

    // 2. 清空现有数据
    console.log('🧹 清空旧数据...');
    await prisma.listing.deleteMany({});
    console.log('✅ 旧数据已清空\n');

    // 3. 创建房源（每张图片一个房源）
    console.log(`📦 创建 ${imageFiles.length} 个房源...\n`);
    const listings = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i];
      const country = countries[i % countries.length];
      const category = categories[i % categories.length];
      const title = `${titles[i % titles.length]} ${i + 1}`;
      const price = Math.floor(Math.random() * 400) + 50; // $50-$450
      const rooms = Math.floor(Math.random() * 4) + 1; // 1-5
      const bathrooms = Math.floor(Math.random() * 3) + 1; // 1-4
      const guests = Math.floor(Math.random() * 6) + 1; // 1-7
      
      listings.push({
        title,
        description: `Beautiful ${category.toLowerCase()} property with amazing views and modern amenities. Perfect for your next vacation! Located in a prime area with easy access to local attractions.`,
        imageSrc: `/pic/${imageFile}`, // 使用本地图片路径
        category,
        roomCount: rooms,
        bathroomCount: bathrooms,
        guestCount: guests,
        locationValue: country,
        userId: DEMO_USER_ID,
        price
      });

      // 每10个显示进度
      if ((i + 1) % 10 === 0) {
        console.log(`   ✓ 创建了 ${i + 1}/${imageFiles.length} 个房源...`);
      }
    }

    // 批量插入
    await prisma.listing.createMany({
      data: listings
    });

    console.log(`\n✅ ${imageFiles.length} 个房源创建完成！\n`);

    // 4. 显示统计
    const total = await prisma.listing.count();
    const avgPrice = Math.floor(listings.reduce((sum, l) => sum + l.price, 0) / listings.length);
    
    console.log('📊 数据统计:');
    console.log(`   总房源数: ${total}`);
    console.log(`   平均价格: $${avgPrice}/晚`);
    console.log(`   涵盖国家: ${countries.length}个`);
    console.log(`   房源类型: ${categories.length}种`);
    console.log(`   使用图片: ${imageFiles.length}张本地图片\n`);

    // 5. 显示前5个房源示例
    console.log('🏠 房源示例:');
    for (let i = 0; i < Math.min(5, listings.length); i++) {
      console.log(`   ${i + 1}. ${listings[i].title} - $${listings[i].price}/晚 (${listings[i].locationValue})`);
    }

    console.log('\n✅ 数据导入完成！');
    console.log('🌐 现在刷新你的 Vercel 网站查看效果！\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWithLocalImages();

