// Load environment variables
require('dotenv').config({ path: '.env.local' });

import prisma from '../lib/prismadb';
import { generateEmbedding } from '../lib/gemini';
import { storeListingEmbedding } from '../lib/supabase';

async function generateAllEmbeddings() {
  try {
    console.log('🚀 开始生成房源 embeddings...\n');

    // 1. 获取所有房源
    const listings = await prisma.listing.findMany();
    console.log(`📦 找到 ${listings.length} 个房源\n`);

    let successCount = 0;
    let errorCount = 0;

    // 2. 为每个房源生成 embedding
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      
      try {
        // 组合房源信息为文本
        const content = `
          ${listing.title}
          ${listing.description}
          Category: ${listing.category}
          Location: ${listing.locationValue}
          Price: $${listing.price} per night
          ${listing.roomCount} bedrooms, ${listing.bathroomCount} bathrooms
          Accommodates ${listing.guestCount} guests
        `.trim();

        // 生成 embedding
        console.log(`[${i + 1}/${listings.length}] 处理: ${listing.title}`);
        const embedding = await generateEmbedding(content);

        // 存储到 Supabase
        await storeListingEmbedding(
          listing.id,
          embedding,
          content,
          {
            title: listing.title,
            category: listing.category,
            price: listing.price,
            locationValue: listing.locationValue,
            roomCount: listing.roomCount,
            bathroomCount: listing.bathroomCount,
            guestCount: listing.guestCount,
          }
        );

        successCount++;
        console.log(`✅ 成功\n`);

        // 防止 API 限流，每次请求后等待
        if (i < listings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        errorCount++;
        console.error(`❌ 失败: ${error.message}\n`);
      }
    }

    // 3. 显示结果
    console.log('\n📊 生成完成！');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${errorCount}`);
    console.log(`📈 总计: ${listings.length}\n`);

    console.log('🎉 Embeddings 已生成并存储到 Supabase！');
    console.log('💡 现在可以使用 AI 助手进行语义搜索了！\n');

  } catch (error: any) {
    console.error('❌ 生成 embeddings 失败:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
generateAllEmbeddings();

