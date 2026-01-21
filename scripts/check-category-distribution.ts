
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const validCategories = [
    "Beach", "Windmills", "Modern", "Countryside", "Pools",
    "Islands", "Lake", "Skiing", "Castles", "Caves",
    "Camping", "Arctic", "Desert", "Barns", "Lux"
];

async function checkDistribution() {
    console.log("📊 Starting Category Distribution Analysis...");

    const listings = await prisma.listing.findMany({
        select: {
            category: true,
            id: true
        }
    });

    const categoryCounts: Record<string, number> = {};
    let nullCategoryCount = 0;
    let invalidCategoryCount = 0;

    for (const listing of listings) {
        if (!listing.category) {
            nullCategoryCount++;
            continue;
        }

        if (!validCategories.includes(listing.category)) {
            invalidCategoryCount++;
            // console.log(`Invalid category: ${listing.category} (ID: ${listing.id})`);
        }

        categoryCounts[listing.category] = (categoryCounts[listing.category] || 0) + 1;
    }

    console.log(`\n📋 Total Listings: ${listings.length}`);

    console.log("\n📈 Count by Category:");
    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([cat, count]) => {
        const isValid = validCategories.includes(cat) ? "✅" : "❌";
        console.log(`   ${isValid} ${cat}: ${count}`);
    });

    console.log("\n⚠️ Anomalies:");
    console.log(`   - Null/Empty Categories: ${nullCategoryCount}`);
    console.log(`   - Invalid Categories: ${invalidCategoryCount}`);

    // Suggest fix if needed
    if (invalidCategoryCount > 0 || nullCategoryCount > 0) {
        console.log("\n💡 Recommendation: We should auto-assign these to valid categories.");
    }
}

checkDistribution()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
