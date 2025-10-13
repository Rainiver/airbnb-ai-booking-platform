import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 将非标准 locationValue（如 "Urban", "Lux" 等）统一回退为一个可识别国家代码，例如 "US"
const FALLBACK_COUNTRY = 'US';

async function main() {
  const listings = await prisma.listing.findMany({ select: { id: true, locationValue: true } });
  let changed = 0;
  for (const item of listings) {
    // ISO 3166-1 alpha-2 两位大写字母才保留
    const isISO2 = /^[A-Z]{2}$/.test(item.locationValue || '');
    if (!isISO2) {
      await prisma.listing.update({ where: { id: item.id }, data: { locationValue: FALLBACK_COUNTRY } });
      changed++;
    }
  }
  console.log(`已修正 ${changed} 条 locationValue 为 ${FALLBACK_COUNTRY}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


