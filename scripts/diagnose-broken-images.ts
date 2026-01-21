
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function diagnose() {
    console.log("🔍 Starting diagnostic scan for broken images...");

    const listings = await prisma.listing.findMany({
        select: {
            id: true,
            title: true,
            category: true,
            imageSrc: true,
        }
    });

    console.log(`📋 Checked ${listings.length} listings in database.`);

    const publicDir = path.join(process.cwd(), "public");
    let brokenCount = 0;
    const brokenByCategory: Record<string, number> = {};

    for (const listing of listings) {
        if (!listing.imageSrc) {
            console.log(`❌ [missing_src] ID: ${listing.id} has empty imageSrc`);
            continue;
        }

        // imageSrc is usually like '/images/synthetic/file.jpg'
        // We need to resolve this to absolute path
        const relativePath = listing.imageSrc.startsWith('/') ? listing.imageSrc.slice(1) : listing.imageSrc;
        const absolutePath = path.join(publicDir, relativePath);

        if (!fs.existsSync(absolutePath)) {
            brokenCount++;
            console.log(`❌ [missing_file] ID: ${listing.id} | Cat: ${listing.category} | Path: ${listing.imageSrc}`);

            brokenByCategory[listing.category] = (brokenByCategory[listing.category] || 0) + 1;
        }
    }

    console.log("\n📊 Diagnostic Results:");
    console.log(`   Total Listings: ${listings.length}`);
    console.log(`   Broken Images:  ${brokenCount}`);

    if (brokenCount > 0) {
        console.log("\n   Broken by Category:");
        Object.entries(brokenByCategory).forEach(([cat, count]) => {
            console.log(`   - ${cat}: ${count}`);
        });
    } else {
        console.log("✅ No broken images found!");
    }
}

diagnose()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
