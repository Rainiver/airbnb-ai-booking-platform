
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const newFormat = await prisma.listing.findFirst({
        where: { imageSrc: { startsWith: '/images/synthetic/img_' } }
    });
    console.log("New Format Image Src:", newFormat?.imageSrc);

    const countOld = await prisma.listing.count({
        where: { imageSrc: { startsWith: '/images/synthetic/synthetic-' } }
    });
    console.log("Count of 'old' style images:", countOld);
}

main().finally(() => prisma.$disconnect());
