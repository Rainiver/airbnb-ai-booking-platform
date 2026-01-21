
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const listing = await prisma.listing.findFirst({
        where: { imageSrc: { contains: 'synthetic' } }
    });
    console.log("Sample Image Src:", listing?.imageSrc);
}

main().finally(() => prisma.$disconnect());
