import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const imagesDir = path.join(process.cwd(), 'public', 'pic');
  if (!fs.existsSync(imagesDir)) {
    console.error('目录不存在: public/pic');
    process.exit(1);
  }

  const files = fs
    .readdirSync(imagesDir)
    .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));

  if (files.length === 0) {
    console.error('public/pic 下未找到图片');
    process.exit(1);
  }

  const listings = await prisma.listing.findMany({ select: { id: true } });
  if (listings.length === 0) {
    console.error('数据库中暂无房源，请先创建一些房源再运行。');
    process.exit(1);
  }

  let updated = 0;
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const file = files[i % files.length];
    const imageSrc = `/pic/${file}`;
    await prisma.listing.update({ where: { id: listing.id }, data: { imageSrc } });
    updated++;
  }

  console.log(`已更新 ${updated} 个房源图片，来自 public/pic，共 ${files.length} 张本地图片`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


