import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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

  shuffle(files);

  const listings = await prisma.listing.findMany({ select: { id: true } });
  if (listings.length === 0) {
    console.error('数据库中暂无房源');
    process.exit(1);
  }

  let idx = 0;
  for (const l of listings) {
    const file = files[idx % files.length];
    const imageSrc = `/pic/${file}`;
    await prisma.listing.update({ where: { id: l.id }, data: { imageSrc } });
    idx++;
  }

  console.log(`已将 ${files.length} 张图片随机打乱并分配给 ${listings.length} 个房源`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


