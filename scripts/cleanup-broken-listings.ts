
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.listing.deleteMany({
        where: { imageSrc: { startsWith: '/images/synthetic/synthetic-' } }
    });
    console.log(`Deleted ${result.count} broken 'old' listings.`);
}

main().finally(() => prisma.$disconnect());
