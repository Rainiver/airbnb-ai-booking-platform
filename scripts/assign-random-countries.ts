import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 仅从常见/热门国家中分配，确保前端展示更贴近日常认知
// 可按需调整列表
const POPULAR_ISO2 = [
  'US','GB','FR','DE','IT','ES','CA','AU','JP','KR',
  'CN','SG','AE','TH','VN','BR','MX','TR','NL','SE',
  'CH','AT','BE','DK','NO','FI','IE','PT','GR','CZ',
  'PL','HU','RO','IL','SA','QA','IN','ID','MY','NZ'
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const listings = await prisma.listing.findMany({ select: { id: true } });
  let updated = 0;
  for (const l of listings) {
    const code = pick(POPULAR_ISO2);
    await prisma.listing.update({ where: { id: l.id }, data: { locationValue: code } });
    updated++;
  }
  console.log(`已为 ${updated} 个房源分配『热门国家』代码 (ISO2)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


