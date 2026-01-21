
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function cleanup() {
    console.log("🧹 Starting cleanup of broken images...");

    const listings = await prisma.listing.findMany({
        select: {
            id: true,
            imageSrc: true,
        }
    });

    console.log(`📋 Checked ${listings.length} listings.`);

    const publicDir = path.join(process.cwd(), "public");
    const brokenIds: string[] = [];

    for (const listing of listings) {
        if (!listing.imageSrc) {
            brokenIds.push(listing.id);
            continue;
        }

        const relativePath = listing.imageSrc.startsWith('/') ? listing.imageSrc.slice(1) : listing.imageSrc;
        const absolutePath = path.join(publicDir, relativePath);

        if (!fs.existsSync(absolutePath)) {
            brokenIds.push(listing.id);
            process.stdout.write('x');
        } else {
            // process.stdout.write('.');
        }
    }

    console.log(`\n\n🚨 Found ${brokenIds.length} broken listings.`);

    if (brokenIds.length > 0) {
        console.log("🗑 Deleting broken listings...");
        const result = await prisma.listing.deleteMany({
            where: {
                id: { in: brokenIds }
            }
        });
        console.log(`✅ Successfully deleted ${result.count} listings.`);
    } else {
        console.log("✅ No broken listings to delete.");
    }
}

cleanup()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
